import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'

interface TeamInviteEmailProps {
  organizationName: string
  inviterName: string
  inviteUrl: string
}

export function TeamInviteEmail({
  organizationName,
  inviterName,
  inviteUrl,
}: TeamInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {organizationName} on BidVet</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're invited to join {organizationName}</Heading>

          <Text style={text}>
            {inviterName} has invited you to join their team on BidVet, the AI-powered
            bid leveling tool for construction professionals.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              🏗️ <strong>Organization:</strong> {organizationName}
            </Text>
            <Text style={highlightText}>
              👤 <strong>Invited by:</strong> {inviterName}
            </Text>
          </Section>

          <Text style={text}>
            As a team member, you'll be able to:
          </Text>

          <ul style={list}>
            <li style={listItem}>Create and manage bid comparisons</li>
            <li style={listItem}>Share projects with your team</li>
            <li style={listItem}>Access AI-powered scope analysis</li>
            <li style={listItem}>Export professional reports</li>
          </ul>

          <Section style={buttonContainer}>
            <Button style={button} href={inviteUrl}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={mutedText}>
            This invitation will expire in 7 days. If you didn't expect this invite,
            you can safely ignore this email.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            BidVet by Foxtrove.ai
            <br />
            Compare subcontractor bids in minutes, not hours.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 24px',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const highlightBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #bbf7d0',
}

const highlightText = {
  color: '#166534',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
}

const list = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '24px',
  paddingLeft: '20px',
  margin: '16px 0',
}

const listItem = {
  marginBottom: '8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const mutedText = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
}
