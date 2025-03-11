"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLinking, setIsLinking] = useState(false);
  const [linkingResult, setLinkingResult] = useState<string | null>(null);

  let errorMessage = "An error occurred during authentication.";
  let isOAuthLinkingError = false;
  
  if (error === "AccessDenied") {
    errorMessage = "You do not have permission to access this resource.";
  } else if (error === "Configuration") {
    errorMessage = "There is a problem with the server configuration.";
  } else if (error === "Verification") {
    errorMessage = "The verification link may have expired or already been used.";
  } else if (error === "OAuthAccountNotLinked") {
    errorMessage = "This email is already associated with another account. You need to sign in with the same account you used originally.";
    isOAuthLinkingError = true;
  }

  const handleLinkAccounts = async () => {
    setIsLinking(true);
    try {
      // Get the current session
      const sessionResponse = await fetch('/api/auth/session');
      const session = await sessionResponse.json();
      
      if (!session || !session.user) {
        setLinkingResult("You need to be signed in to link accounts.");
        setIsLinking(false);
        return;
      }
      
      // Call our custom API to link the accounts
      const response = await fetch('/api/auth/link-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          // We don't have the provider account ID here, so this is a placeholder
          // In a real implementation, you would need to get this from the OAuth provider
          providerAccountId: session.user.email,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setLinkingResult("Accounts linked successfully! You can now sign in.");
      } else {
        setLinkingResult(`Error linking accounts: ${data.error}`);
      }
    } catch (error) {
      setLinkingResult("An error occurred while linking accounts.");
      console.error("Error linking accounts:", error);
    }
    setIsLinking(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to home
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {errorMessage}
                </h3>
              </div>
            </div>
          </div>
        </div>
        
        {isOAuthLinkingError && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex flex-col">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  You already have an account with this email address
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    It looks like you previously signed in with a different method. Please sign in using your original sign-in method.
                  </p>
                </div>
                <button
                  onClick={handleLinkAccounts}
                  disabled={isLinking}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLinking ? "Linking accounts..." : "Link accounts"}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {linkingResult && (
          <div className={`mt-4 ${linkingResult.includes('Error') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'} border rounded-md p-4`}>
            <p className="text-sm">{linkingResult}</p>
          </div>
        )}
        
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
              Try signing in again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 