import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components"

interface AdminNewSignupEmailProps {
  userName: string
  userEmail: string
  companyName: string
  promoCode?: string | null
  trainingDataOptIn: boolean
  signupDate: string
}

export function AdminNewSignupEmail({
  userName,
  userEmail,
  companyName,
  promoCode,
  trainingDataOptIn,
  signupDate,
}: AdminNewSignupEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New BidVet Signup: {userName} from {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New User Signup</Heading>

          <Section style={section}>
            <Text style={label}>Name</Text>
            <Text style={value}>{userName}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Email</Text>
            <Text style={value}>{userEmail}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Company</Text>
            <Text style={value}>{companyName}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Promo Code</Text>
            <Text style={value}>{promoCode || "None"}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Training Data Opt-In</Text>
            <Text style={value}>{trainingDataOptIn ? "Yes" : "No"}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Signed up on {signupDate}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
}

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  padding: "0 48px",
}

const section = {
  padding: "0 48px",
  marginBottom: "16px",
}

const label = {
  color: "#666666",
  fontSize: "12px",
  fontWeight: "500",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
}

const value = {
  color: "#1a1a1a",
  fontSize: "16px",
  margin: "0",
}

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 48px",
}

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 48px",
}

export default AdminNewSignupEmail
