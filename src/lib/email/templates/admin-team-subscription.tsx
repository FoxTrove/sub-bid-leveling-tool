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

interface AdminTeamSubscriptionEmailProps {
  userName: string
  userEmail: string
  companyName: string
  organizationName: string
  planType: 'monthly' | 'annual'
  amount: number
  memberCount: number
  subscriptionDate: string
}

export function AdminTeamSubscriptionEmail({
  userName,
  userEmail,
  companyName,
  organizationName,
  planType,
  amount,
  memberCount,
  subscriptionDate,
}: AdminTeamSubscriptionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New Team Subscription: {organizationName} - ${String(amount)}/{planType === 'monthly' ? 'mo' : 'yr'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎉 New Team Subscription!</Heading>

          <Section style={section}>
            <Text style={label}>Organization</Text>
            <Text style={value}>{organizationName}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Owner</Text>
            <Text style={value}>{userName}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Owner Email</Text>
            <Text style={value}>{userEmail}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Company</Text>
            <Text style={value}>{companyName}</Text>
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Text style={label}>Plan</Text>
            <Text style={value}>Team {planType === 'monthly' ? 'Monthly' : 'Annual'}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Amount</Text>
            <Text style={valueHighlight}>${amount}/{planType === 'monthly' ? 'mo' : 'yr'}</Text>
          </Section>

          <Section style={section}>
            <Text style={label}>Current Members</Text>
            <Text style={value}>{memberCount}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Subscribed on {subscriptionDate}
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

const valueHighlight = {
  color: "#22c55e",
  fontSize: "20px",
  fontWeight: "600",
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

export default AdminTeamSubscriptionEmail
