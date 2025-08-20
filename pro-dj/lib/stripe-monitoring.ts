import { stripe, monitoringConfig } from "./stripe-config";
import { prisma } from "./prisma";

// Payment monitoring and alerting system
export class StripeMonitor {
  private static instance: StripeMonitor;
  private alertThresholds = {
    paymentFailureRate: 0.05, // 5%
    refundRate: 0.1, // 10%
    chargebackRate: 0.02, // 2%
    webhookFailureRate: 0.01, // 1%
  };

  static getInstance(): StripeMonitor {
    if (!StripeMonitor.instance) {
      StripeMonitor.instance = new StripeMonitor();
    }
    return StripeMonitor.instance;
  }

  // Track payment success rate
  async trackPaymentSuccess(bookingId: string, success: boolean) {
    try {
      await prisma.paymentMetric.create({
        data: {
          bookingId,
          type: "PAYMENT_ATTEMPT",
          success,
          amount: 0, // Will be updated from booking
          timestamp: new Date(),
        },
      });

      // Calculate and alert if failure rate is high
      await this.checkPaymentFailureRate();
    } catch (error) {
      console.error("Error tracking payment success:", error);
    }
  }

  // Track refunds
  async trackRefund(bookingId: string, amount: number, reason: string) {
    try {
      await prisma.paymentMetric.create({
        data: {
          bookingId,
          type: "REFUND",
          success: true,
          amount,
          metadata: { reason },
          timestamp: new Date(),
        },
      });

      // Calculate and alert if refund rate is high
      await this.checkRefundRate();
    } catch (error) {
      console.error("Error tracking refund:", error);
    }
  }

  // Track chargebacks/disputes
  async trackDispute(bookingId: string, amount: number, reason: string) {
    try {
      await prisma.paymentMetric.create({
        data: {
          bookingId,
          type: "DISPUTE",
          success: false,
          amount,
          metadata: { reason },
          timestamp: new Date(),
        },
      });

      // Calculate and alert if chargeback rate is high
      await this.checkChargebackRate();
    } catch (error) {
      console.error("Error tracking dispute:", error);
    }
  }

  // Track webhook failures
  async trackWebhookFailure(eventType: string, error: string) {
    try {
      await prisma.paymentMetric.create({
        data: {
          bookingId: "webhook", // Special identifier for webhook events
          type: "WEBHOOK_FAILURE",
          success: false,
          amount: 0,
          metadata: { eventType, error },
          timestamp: new Date(),
        },
      });

      // Calculate and alert if webhook failure rate is high
      await this.checkWebhookFailureRate();
    } catch (error) {
      console.error("Error tracking webhook failure:", error);
    }
  }

  // Check payment failure rate
  private async checkPaymentFailureRate() {
    const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    const metrics = await prisma.paymentMetric.findMany({
      where: {
        type: "PAYMENT_ATTEMPT",
        timestamp: { gte: timeWindow },
      },
    });

    const totalAttempts = metrics.length;
    const failures = metrics.filter((m) => !m.success).length;
    const failureRate = totalAttempts > 0 ? failures / totalAttempts : 0;

    if (failureRate > this.alertThresholds.paymentFailureRate) {
      await this.sendAlert("HIGH_PAYMENT_FAILURE_RATE", {
        failureRate: (failureRate * 100).toFixed(2),
        totalAttempts,
        failures,
      });
    }
  }

  // Check refund rate
  private async checkRefundRate() {
    const timeWindow = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const payments = await prisma.paymentMetric.findMany({
      where: {
        type: "PAYMENT_ATTEMPT",
        success: true,
        timestamp: { gte: timeWindow },
      },
    });

    const refunds = await prisma.paymentMetric.findMany({
      where: {
        type: "REFUND",
        timestamp: { gte: timeWindow },
      },
    });

    const totalPayments = payments.length;
    const totalRefunds = refunds.length;
    const refundRate = totalPayments > 0 ? totalRefunds / totalPayments : 0;

    if (refundRate > this.alertThresholds.refundRate) {
      await this.sendAlert("HIGH_REFUND_RATE", {
        refundRate: (refundRate * 100).toFixed(2),
        totalPayments,
        totalRefunds,
      });
    }
  }

  // Check chargeback rate
  private async checkChargebackRate() {
    const timeWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    const payments = await prisma.paymentMetric.findMany({
      where: {
        type: "PAYMENT_ATTEMPT",
        success: true,
        timestamp: { gte: timeWindow },
      },
    });

    const disputes = await prisma.paymentMetric.findMany({
      where: {
        type: "DISPUTE",
        timestamp: { gte: timeWindow },
      },
    });

    const totalPayments = payments.length;
    const totalDisputes = disputes.length;
    const disputeRate = totalPayments > 0 ? totalDisputes / totalPayments : 0;

    if (disputeRate > this.alertThresholds.chargebackRate) {
      await this.sendAlert("HIGH_CHARGEBACK_RATE", {
        disputeRate: (disputeRate * 100).toFixed(2),
        totalPayments,
        totalDisputes,
      });
    }
  }

  // Check webhook failure rate
  private async checkWebhookFailureRate() {
    const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    const webhooks = await prisma.paymentMetric.findMany({
      where: {
        type: "WEBHOOK_FAILURE",
        timestamp: { gte: timeWindow },
      },
    });

    // This is a simplified check - in production you'd track total webhook attempts
    const failureCount = webhooks.length;

    if (failureCount > 10) {
      // Alert if more than 10 webhook failures in 24 hours
      await this.sendAlert("HIGH_WEBHOOK_FAILURE_RATE", {
        failureCount,
        timeWindow: "24 hours",
      });
    }
  }

  // Send alerts
  private async sendAlert(type: string, data: any) {
    try {
      // Log the alert
      console.error(`🚨 STRIPE ALERT: ${type}`, data);

      // Store alert in database
      await prisma.paymentAlert.create({
        data: {
          type,
          data,
          timestamp: new Date(),
          isResolved: false,
        },
      });

      // Send email alert to admin
      if (process.env.ADMIN_EMAIL) {
        // You can implement email sending here
        console.log(`📧 Sending alert email to ${process.env.ADMIN_EMAIL}`);
      }

      // Send Slack/Discord notification (if configured)
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(type, data);
      }
    } catch (error) {
      console.error("Error sending alert:", error);
    }
  }

  // Send Slack alert
  private async sendSlackAlert(type: string, data: any) {
    try {
      const message = {
        text: `🚨 Stripe Alert: ${type}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Stripe Alert: ${type}*\n${JSON.stringify(data, null, 2)}`,
            },
          },
        ],
      };

      await fetch(process.env.SLACK_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error("Error sending Slack alert:", error);
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(days: number = 30) {
    const timeWindow = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await prisma.paymentMetric.findMany({
      where: {
        timestamp: { gte: timeWindow },
      },
    });

    const payments = metrics.filter((m) => m.type === "PAYMENT_ATTEMPT");
    const refunds = metrics.filter((m) => m.type === "REFUND");
    const disputes = metrics.filter((m) => m.type === "DISPUTE");

    const totalPayments = payments.length;
    const successfulPayments = payments.filter((p) => p.success).length;
    const totalRefunds = refunds.length;
    const totalDisputes = disputes.length;

    const totalRevenue =
      successfulPayments > 0
        ? payments
            .filter((p) => p.success)
            .reduce((sum, p) => sum + p.amount, 0)
        : 0;
    const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);

    return {
      period: `${days} days`,
      totalPayments,
      successfulPayments,
      paymentSuccessRate:
        totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
      totalRevenue: totalRevenue / 100, // Convert from cents
      totalRefunds: totalRefunds,
      totalRefunded: totalRefunded / 100, // Convert from cents
      refundRate:
        successfulPayments > 0 ? (totalRefunds / successfulPayments) * 100 : 0,
      totalDisputes,
      disputeRate:
        successfulPayments > 0 ? (totalDisputes / successfulPayments) * 100 : 0,
      netRevenue: (totalRevenue - totalRefunded) / 100, // Convert from cents
    };
  }

  // Get recent alerts
  async getRecentAlerts(limit: number = 10) {
    return await prisma.paymentAlert.findMany({
      where: { isResolved: false },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  // Resolve alert
  async resolveAlert(alertId: string) {
    return await prisma.paymentAlert.update({
      where: { id: alertId },
      data: { isResolved: true },
    });
  }
}

// Export singleton instance
export const stripeMonitor = StripeMonitor.getInstance();
