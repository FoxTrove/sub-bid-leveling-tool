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

const LOGO_URL = 'https://bidlevel.foxtrove.ai/bidlevel-logo.png'

interface SubscriptionWelcomeEmailProps {
  firstName: string
  planName: string
  billingCycle: 'monthly' | 'annual'
  amount: number
  nextBillingDate: string
}

export function SubscriptionWelcomeEmail({
  firstName,
  planName,
  billingCycle,
  amount,
  nextBillingDate,
}: SubscriptionWelcomeEmailProps) {
  const previewText = `Welcome to BidLevel ${planName} - You're all set!`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="160" height="45" alt="BidLevel" style={logo} />
          </Section>

          <Section style={successBadge}>
            <Text style={checkmark}>&#10003;</Text>
          </Section>

          <Heading style={h1}>Welcome to BidLevel {planName}!</Heading>

          <Text style={text}>
            Hi {firstName || 'there'},
          </Text>

          <Text style={text}>
            Thanks for subscribing! Your {planName} plan is now active and you have unlimited access to BidLevel.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightTitle}>Your subscription details:</Text>
            <Text style={highlightText}>
              <strong>Plan:</strong> {planName}
            </Text>
            <Text style={highlightText}>
              <strong>Billing:</strong> ${amount}/{billingCycle === 'annual' ? 'year' : 'month'}
            </Text>
            <Text style={highlightText}>
              <strong>Next billing date:</strong> {nextBillingDate}
            </Text>
          </Section>

          <Section style={featuresBox}>
            <Text style={featuresTitle}>What's included:</Text>
            <Text style={featureItem}>&#10003; Unlimited bid comparisons</Text>
            <Text style={featureItem}>&#10003; AI-powered scope analysis</Text>
            <Text style={featureItem}>&#10003; PDF exports with your branding</Text>
            <Text style={featureItem}>&#10003; Priority support</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://bidlevel.foxtrove.ai/dashboard">
              Go to Dashboard
            </Button>
          </Section>

          <Text style={text}>
            You can manage your subscription anytime from the{' '}
            <Link href="https://bidlevel.foxtrove.ai/settings" style={link}>
              Settings page
            </Link>.
          </Text>

          <Hr style={hr} />

          <Text style={subtext}>
            Questions? Just reply to this email—we're here to help.
          </Text>

          <Text style={footer}>
            BidLevel by Foxtrove
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

const successBadge = {
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const checkmark = {
  display: 'inline-block',
  backgroundColor: '#10b981',
  color: '#ffffff',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  fontSize: '24px',
  lineHeight: '48px',
  textAlign: 'center' as const,
  margin: '0',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.5',
  marginBottom: '16px',
}

const highlightBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  border: '1px solid #a7f3d0',
}

const highlightTitle = {
  color: '#065f46',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const highlightText = {
  color: '#047857',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '8px',
  marginTop: '0',
}

const featuresBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
}

const featuresTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const featureItem = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.8',
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

const link = {
  color: '#10b981',
  textDecoration: 'underline',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}

const subtext = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '1.5',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  marginTop: '24px',
}

export default SubscriptionWelcomeEmail
