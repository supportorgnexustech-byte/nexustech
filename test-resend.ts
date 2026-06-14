import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const data = await resend.emails.send({
      from: "NexusTech <noreply@nexustech.org>",
      to: "support.org.nexustech@gmail.com",
      subject: "Test Email from Resend",
      html: "<p>This is a test email to verify Resend API.</p>"
    });
    console.log("Success:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

testEmail();
