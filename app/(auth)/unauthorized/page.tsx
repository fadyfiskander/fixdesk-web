function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center w-screen min-h-screen">
      <h1 className="text-4xl font-bold text-red-600">Unauthorized Access</h1>
      <p className="mt-4 text-lg text-gray-700">
        You do not have permission to view this page. Please contact your administrator if you believe this is an error.
      </p>
    </div>
  );
}

export default UnauthorizedPage;