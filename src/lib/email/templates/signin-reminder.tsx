import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

const LOGO_URL = 'https://bidvet.foxtrove.ai/bidvet-logo.png'

interface SigninReminderEmailProps {
  email: string
}

export function SigninReminderEmail({ email }: SigninReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Complete your BidVet signup - Your account is waiting</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="160" height="45" alt="BidVet" style={logo} />
          </Section>

          <Heading style={h1}>Your BidVet account is waiting</Heading>

          <Text style={text}>
            Hi there,
          </Text>

          <Text style={text}>
            You started creating a BidVet account but haven't signed in yet. Your account is ready and waiting for you.
          </Text>

          <Section style={infoBox}>
            <Text style={infoTitle}>What you'll get with BidVet:</Text>
            <Text style={listItem}>AI-powered bid comparison in minutes, not hours</Text>
            <Text style={listItem}>Automatic scope gap detection</Text>
            <Text style={listItem}>Side-by-side contractor analysis</Text>
            <Text style={listItem}>5 free comparisons to get started</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button
              style={button}
              href="https://bidvet.foxtrove.ai/login"
            >
              Sign In to BidVet
            </Button>
          </Section>

          <Text style={text}>
            Just click the button above and sign in with <strong>{email}</strong> to complete your setup.
          </Text>

          <Section style={helpBox}>
            <Text style={helpTitle}>Having trouble signing in?</Text>
            <Text style={helpText}>
              Reply to this email and we'll help you get set up.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            BidVet by Foxtrove
          </Text>
          <Text style={unsubscribe}>
            <Link href="https://bidvet.foxtrove.ai/unsubscribe" style={unsubscribeLink}>
              Unsubscribe
            </Link>
            {' '}from these reminders
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '16px',
}

const infoBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
}

const infoTitle = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const listItem = {
  color: '#15803d',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '6px',
  marginTop: '0',
  paddingLeft: '8px',
}

const helpBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
}

const helpTitle = {
  color: '#475569',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '4px',
  marginTop: '0',
}

const helpText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '0',
  marginBottom: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  marginTop: '24px',
  marginBottom: '8px',
}

const unsubscribe = {
  color: '#8898aa',
  fontSize: '12px',
  marginTop: '0',
}

const unsubscribeLink = {
  color: '#8898aa',
  textDecoration: 'underline',
}

export default SigninReminderEmail
