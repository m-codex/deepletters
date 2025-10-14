import LetterCreationFlow from "@/_components/LetterCreationFlow";

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LetterCreationFlow>{children}</LetterCreationFlow>;
}
