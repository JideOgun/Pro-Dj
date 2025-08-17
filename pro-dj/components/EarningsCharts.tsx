"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MonthlyEarning {
  month: string;
  earnings: number;
  bookings: number;
}

interface BookingTrend {
  month: string;
  pending: number;
  accepted: number;
  confirmed: number;
  declined: number;
}

interface EarningsChartsProps {
  monthlyEarnings: MonthlyEarning[];
  bookingTrends: BookingTrend[];
  chartType: "earnings" | "trends";
}

export default function EarningsCharts({ 
  monthlyEarnings, 
  bookingTrends, 
  chartType 
}: EarningsChartsProps) {
  
  // Earnings Chart Options
  const earningsOptions: ApexOptions = {
    chart: {
      type: "area",
      toolbar: {
        show: false,
      },
      background: "transparent",
    },
    theme: {
      mode: "dark",
    },
    colors: ["#10b981", "#3b82f6"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: monthlyEarnings.map(item => item.month),
      labels: {
        style: {
          colors: "#9ca3af",
        },
      },
      axisBorder: {
        color: "#374151",
      },
      axisTicks: {
        color: "#374151",
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#9ca3af",
        },
        formatter: function(value) {
          return `$${value.toFixed(0)}`;
        },
      },
    },
    grid: {
      borderColor: "#374151",
      strokeDashArray: 5,
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: function(value) {
          return `$${value.toFixed(2)}`;
        },
      },
    },
    legend: {
      labels: {
        colors: "#9ca3af",
      },
    },
  };

  // Booking Trends Chart Options
  const trendsOptions: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
      background: "transparent",
    },
    theme: {
      mode: "dark",
    },
    colors: ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    xaxis: {
      categories: bookingTrends.map(item => item.month),
      labels: {
        style: {
          colors: "#9ca3af",
        },
      },
      axisBorder: {
        color: "#374151",
      },
      axisTicks: {
        color: "#374151",
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#9ca3af",
        },
      },
    },
    grid: {
      borderColor: "#374151",
      strokeDashArray: 5,
    },
    tooltip: {
      theme: "dark",
    },
    legend: {
      labels: {
        colors: "#9ca3af",
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "70%",
      },
    },
  };

  // Earnings Series Data
  const earningsSeries = [
    {
      name: "Earnings",
      data: monthlyEarnings.map(item => item.earnings),
    },
    {
      name: "Bookings",
      data: monthlyEarnings.map(item => item.bookings * 50), // Scale for visibility
    },
  ];

  // Booking Trends Series Data
  const trendsSeries = [
    {
      name: "Pending",
      data: bookingTrends.map(item => item.pending),
    },
    {
      name: "Accepted",
      data: bookingTrends.map(item => item.accepted),
    },
    {
      name: "Confirmed",
      data: bookingTrends.map(item => item.confirmed),
    },
    {
      name: "Declined",
      data: bookingTrends.map(item => item.declined),
    },
  ];

  if (chartType === "earnings") {
    return (
      <div className="w-full">
        <Chart
          options={earningsOptions}
          series={earningsSeries}
          type="area"
          height={300}
        />
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Earnings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-300">Bookings (scaled)</span>
          </div>
        </div>
      </div>
    );
  }

  if (chartType === "trends") {
    return (
      <div className="w-full">
        <Chart
          options={trendsOptions}
          series={trendsSeries}
          type="bar"
          height={300}
        />
        <div className="mt-4 flex justify-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-300">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-300">Accepted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-300">Declined</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
