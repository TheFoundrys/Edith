import { redirect } from "next/navigation";
import { PERSONALITY_EXAM_HREF } from "@/lib/assessments/personality-profile";

export default function PersonalityTakeSectionRedirectPage() {
  redirect(PERSONALITY_EXAM_HREF);
}
