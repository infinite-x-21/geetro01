
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, UserPlus, Inbox } from "lucide-react";
import FriendRequestsList from "@/components/FriendRequestsList";
import FriendsList from "@/components/FriendsList";
import UserSearch from "@/components/UserSearch";
import Navbar from "@/components/Navbar";

export default function FriendsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const navigate = useNavigate();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, [navigate]);

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-20">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="w-full flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft size={22} />
            </Button>
            <h1 className="text-3xl font-bold ml-4">Friends</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-card p-1 rounded-lg">
            <Button
              variant={activeTab === "friends" ? "default" : "ghost"}
              onClick={() => setActiveTab("friends")}
              className="flex-1"
            >
              <Users size={16} className="mr-2" />
              Friends
            </Button>
            <Button
              variant={activeTab === "requests" ? "default" : "ghost"}
              onClick={() => setActiveTab("requests")}
              className="flex-1"
            >
              <Inbox size={16} className="mr-2" />
              Requests
            </Button>
            <Button
              variant={activeTab === "search" ? "default" : "ghost"}
              onClick={() => setActiveTab("search")}
              className="flex-1"
            >
              <UserPlus size={16} className="mr-2" />
              Find Friends
            </Button>
          </div>

          {/* Content */}
          <div className="bg-card p-6 rounded-xl shadow border border-primary/10">
            {activeTab === "friends" && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Users className="text-amber-400" size={24} />
                  <h2 className="text-xl font-bold">Your Friends</h2>
                </div>
                <FriendsList currentUserId={currentUserId} />
              </div>
            )}

            {activeTab === "requests" && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Inbox className="text-amber-400" size={24} />
                  <h2 className="text-xl font-bold">Friend Requests</h2>
                </div>
                <FriendRequestsList currentUserId={currentUserId} />
              </div>
            )}

            {activeTab === "search" && (
              <div>
                <UserSearch />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
