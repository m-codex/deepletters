import LetterViewer from "@/_components/LetterViewer";

export default function Page({ params }: { params: { shareCode: string } }) {
  return <LetterViewer shareCode={params.shareCode} />;
}
