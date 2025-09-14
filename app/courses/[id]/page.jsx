import { redirect } from "next/navigation";

export default function CourseRedirectPage({ params }) {
  const { id } = params;
  redirect(`/courses/${id}/content`);
}
