import LetterPage from "@/_components/LetterPage";

export const dynamic = "force-dynamic";

export default function Page({
  params,
}: {
  params: { managementToken: string };
}) {
  return <LetterPage managementToken={params.managementToken} />;
}
