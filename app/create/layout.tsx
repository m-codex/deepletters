import LetterCreationFlow from "@/_components/LetterCreationFlow";

export const dynamic = 'force-dynamic';

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LetterCreationFlow>{children}</LetterCreationFlow>;
}
