import { redirect } from "next/navigation";

export default function EditPage({ params }: { params: { shareCode: string } }) {
  redirect(`/edit/${params.shareCode}/write`);
}
