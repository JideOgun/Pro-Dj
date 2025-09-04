"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar } from "lucide-react";

interface Booking {
  id: string;
  eventType: string;
  eventDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  status: string;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  dj?: {
    stageName?: string | null;
  } | null;
}

interface BookingCalendarProps {
  bookings: Booking[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    status: string;
    eventType: string;
    clientName: string;
    djName?: string;
  };
}

export default function BookingCalendar({ bookings }: BookingCalendarProps) {
  const router = useRouter();
  const [view, setView] = useState("dayGridMonth");

  const events: CalendarEvent[] = bookings
    .filter((booking) => {
      return (
        booking.startTime &&
        booking.endTime &&
        booking.startTime instanceof Date &&
        booking.endTime instanceof Date
      );
    })
    .map((booking) => {
      let backgroundColor = "#3b82f6"; // Default blue
      let borderColor = "#2563eb";

      switch (booking.status) {
        case "PENDING":
          backgroundColor = "#f59e0b"; // Yellow
          borderColor = "#d97706";
          break;
        case "CONFIRMED":
          backgroundColor = "#10b981"; // Green
          borderColor = "#059669";
          break;
        case "CANCELLED":
          backgroundColor = "#ef4444"; // Red
          borderColor = "#dc2626";
          break;
        case "ACCEPTED":
          backgroundColor = "#3b82f6"; // Blue
          borderColor = "#2563eb";
          break;
      }

      return {
        id: booking.id,
        title: `${booking.eventType} - ${
          booking.user?.name || booking.user?.email || "Unknown"
        }`,
        start: booking.startTime,
        end: booking.endTime,
        backgroundColor,
        borderColor,
        textColor: "white",
        extendedProps: {
          status: booking.status,
          eventType: booking.eventType,
          clientName: booking.user?.name || booking.user?.email || "Unknown",
          djName: booking.dj?.stageName,
        },
      };
    });

  const handleEventClick = (clickInfo: any) => {
    const eventId = clickInfo.event.id;
    if (eventId) {
      router.push(`/dashboard/bookings/${eventId}`);
    }
  };

  const handleViewChange = (viewInfo: any) => {
    setView(viewInfo.view.type);
  };

  return (
    <div className="h-full bg-gray-800 rounded-lg p-4">
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <Calendar className="w-16 h-16 mb-4 mx-auto" />
            <p className="text-lg font-medium">
              No bookings with valid times found
            </p>
            <p className="text-sm opacity-75 mt-2">
              Create a booking to see it here
            </p>
          </div>
        </div>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          initialView={view}
          views={{
            dayGridMonth: {
              titleFormat: { year: "numeric", month: "long" },
            },
            timeGridWeek: {
              titleFormat: { year: "numeric", month: "short", day: "numeric" },
            },
            timeGridDay: {
              titleFormat: { year: "numeric", month: "long", day: "numeric" },
            },
          }}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleViewChange}
          height="100%"
          eventDisplay="block"
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventDidMount={(info) => {
            // Add custom styling if needed
            info.el.style.cursor = "pointer";
          }}
        />
      )}
    </div>
  );
}
