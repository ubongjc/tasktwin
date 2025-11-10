import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default async function AdminDashboard() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch admin statistics
  const [totalUsers, activeUsers, totalSessions, activeSubscriptions, totalRevenue, recentReports] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.room.count({
        where: { status: "COMPLETED" },
      }),
      prisma.subscription.count({
        where: { status: "active" },
      }),
      prisma.payment.aggregate({
        where: { status: "succeeded" },
        _sum: { amount: true },
      }),
      prisma.report.count({
        where: { status: "PENDING" },
      }),
    ]);

  const revenue = (totalRevenue._sum.amount || 0) / 100;
  const mrr = activeSubscriptions * 2.99; // Simplified MRR calculation

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and management
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeUsers} active this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sessions
              </CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Subscriptions
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubscriptions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ${mrr.toFixed(2)} MRR
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {recentReports > 0 && (
          <Card className="mb-8 border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertCircle className="w-5 h-5" />
                Pending Reports
              </CardTitle>
              <CardDescription>
                There are {recentReports} user reports awaiting review
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage platform users</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>
                Review reports and moderate content
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                View detailed platform analytics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Manage user subscriptions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Monitor system performance</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure platform settings</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
