import AdminLoginForm from "./login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const params = await searchParams;

  return (
    <AdminLoginForm
      permissionError={params.erro === "permissao"}
    />
  );
}
