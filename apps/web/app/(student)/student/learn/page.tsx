import { redirect } from "next/navigation";

export default function StudentLearnRedirect() {
  redirect("/student/my-courses");
}
