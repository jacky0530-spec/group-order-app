"use client";
import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("../../components/OrderDashboard"), {
  ssr: false,
});

export default function AdminPage() {
  return <Dashboard />;
}