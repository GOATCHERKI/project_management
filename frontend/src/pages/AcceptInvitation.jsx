import { useEffect, useState } from "react";
import { Loader2Icon, CheckCircle2, XCircle } from "lucide-react";
import { RedirectToSignIn, useAuth, useOrganizationList } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AcceptInvitation = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: orgListLoaded, userInvitations } = useOrganizationList({
    userInvitations: {
      infinite: true,
    },
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, accepting, success, error
  const [message, setMessage] = useState("Checking invitation...");

  useEffect(() => {
    const acceptInvitation = async () => {
      if (!isLoaded || !orgListLoaded || !isSignedIn) {
        return;
      }

      try {
        console.log("=== Accept Invitation Flow ===");
        console.log("Pending invitations:", userInvitations?.count);

        // Check if there's a __clerk_ticket in URL
        const ticket = searchParams.get("__clerk_ticket");
        console.log("Ticket in URL:", ticket ? "Present" : "Not found");

        if (!userInvitations || userInvitations.count === 0) {
          console.log("No pending invitations found");
          setStatus("error");
          setMessage("No pending invitations found. You may have already accepted this invitation.");
          
          // Wait a bit then redirect to check if user is already a member
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 3000);
          return;
        }

        setStatus("accepting");
        setMessage("Accepting invitation...");

        // Accept the first pending invitation
        const invitation = userInvitations.data[0];
        console.log("Accepting invitation:", invitation.id);
        console.log("Organization:", invitation.publicOrganizationData?.name);

        await invitation.accept();
        
        console.log("Invitation accepted successfully!");
        setStatus("success");
        setMessage("Adding you to workspace...");

        // Get the organization ID from the invitation
        const organizationId = invitation.publicOrganizationData?.id;
        console.log("Organization ID for sync:", organizationId);
        
        // Wait a moment for Clerk to update
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Sync user to database
        let syncSuccess = false;
        if (organizationId) {
          try {
            const token = await getToken();
            console.log("Got auth token, calling sync-member endpoint...");
            
            const backendUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
            const syncUrl = `${backendUrl}/api/workspaces/sync-member`;
            console.log("Fetch URL:", syncUrl);
            console.log("Request body:", { organizationId, role: "MEMBER" });
            
            const response = await fetch(syncUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                organizationId,
                role: "MEMBER",
              }),
            });

            const data = await response.json();
            console.log("Sync response status:", response.status);
            console.log("Sync response:", data);

            if (response.ok) {
              console.log("✓ Member synced to database successfully!");
              syncSuccess = true;
              setMessage("Welcome! Redirecting...");
              await new Promise((resolve) => setTimeout(resolve, 1000));
            } else {
              console.error("Failed to sync member to database:", data);
              setMessage("Warning: Added to Clerk but database sync failed. Redirecting anyway...");
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          } catch (error) {
            console.error("Error syncing member:", error);
            setMessage("Warning: Sync error. Redirecting anyway...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        } else {
          console.error("No organization ID found in invitation");
          setMessage("No organization ID found. Redirecting...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Always redirect to dashboard
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Error accepting invitation:", error);
        setStatus("error");
        setMessage(`Failed to accept invitation: ${error.message}`);
      }
    };

    acceptInvitation();
  }, [isLoaded, orgListLoaded, isSignedIn, userInvitations, navigate, searchParams, getToken]);

  if (!isLoaded || !orgListLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2Icon className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn redirectUrl={window.location.href} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-200 px-4">
      <div className="text-center space-y-4 max-w-md">
        {status === "loading" && (
          <>
            <Loader2Icon className="size-12 animate-spin text-blue-500 mx-auto" />
            <h2 className="text-xl font-semibold">{message}</h2>
          </>
        )}

        {status === "accepting" && (
          <>
            <Loader2Icon className="size-12 animate-spin text-blue-500 mx-auto" />
            <h2 className="text-xl font-semibold">{message}</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This will only take a moment...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="size-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">
              {message}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Welcome to your new workspace!
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="size-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
              Unable to Accept Invitation
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitation;
