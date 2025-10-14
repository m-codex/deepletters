import LetterPage from "@/_components/LetterPage";

export const dynamic = "force-dynamic";

export default function Page({
  params,
  searchParams,
}: {
  params: { managementToken: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const encryptionKey = searchParams?.key as string | undefined;
  return (
    <LetterPage
      managementToken={params.managementToken}
      encryptionKey={encryptionKey}
    />
  );
}
