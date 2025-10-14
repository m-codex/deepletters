import LetterCreationFlow from "@/_components/LetterCreationFlow";

export default function EditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LetterCreationFlow>{children}</LetterCreationFlow>;
}
