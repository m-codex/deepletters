import LetterPage from "@/_components/LetterPage";

export default function Page({
  params,
}: {
  params: { managementToken: string };
}) {
  return <LetterPage managementToken={params.managementToken} />;
}
