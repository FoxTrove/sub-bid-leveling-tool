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

interface PaymentFailedEmailProps {
  firstName: string
  planName: string
  amount: number
  nextRetryDate?: string
}

export function PaymentFailedEmail({
  firstName,
  planName,
  amount,
  nextRetryDate,
}: PaymentFailedEmailProps) {
  const previewText = `Action required: Your BidVet payment couldn't be processed`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="160" height="45" alt="BidVet" style={logo} />
          </Section>

          <Section style={warningBadge}>
            <Text style={warningIcon}>!</Text>
          </Section>

          <Heading style={h1}>Payment Failed</Heading>

          <Text style={text}>
            Hi {firstName || 'there'},
          </Text>

          <Text style={text}>
            We couldn't process your payment of ${amount} for your BidVet {planName} subscription. This can happen if your card expired, was declined, or has insufficient funds.
          </Text>

          <Section style={alertBox}>
            <Text style={alertTitle}>Action required</Text>
            <Text style={alertText}>
              Please update your payment method to avoid losing access to your {planName} features.
            </Text>
            {nextRetryDate && (
              <Text style={alertText}>
                <strong>We'll automatically retry on:</strong> {nextRetryDate}
              </Text>
            )}
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://bidvet.foxtrove.ai/settings">
              Update Payment Method
            </Button>
          </Section>

          <Section style={stepsBox}>
            <Text style={stepsTitle}>To update your payment:</Text>
            <Text style={stepText}>1. Go to Settings → Billing</Text>
            <Text style={stepText}>2. Click "Manage Subscription"</Text>
            <Text style={stepText}>3. Update your card details</Text>
          </Section>

          <Section style={infoBox}>
            <Text style={infoTitle}>What happens if payment continues to fail?</Text>
            <Text style={infoText}>
              After a few retry attempts, your subscription will be canceled. But don't worry—your data and past comparisons will remain safe and accessible.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={subtext}>
            Having trouble?{' '}
            <Link href="mailto:kyle@tryelderconstruction.com" style={link}>
              Contact support
            </Link>{' '}
            and we'll help you sort it out.
          </Text>

          <Text style={footer}>
            BidVet by Foxtrove
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

const warningBadge = {
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const warningIcon = {
  display: 'inline-block',
  backgroundColor: '#ef4444',
  color: '#ffffff',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  fontSize: '28px',
  fontWeight: '700',
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

const alertBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  border: '1px solid #fca5a5',
}

const alertTitle = {
  color: '#991b1b',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '8px',
  marginTop: '0',
}

const alertText = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '8px',
  marginTop: '0',
}

const stepsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
}

const stepsTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const stepText = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.6',
  marginBottom: '4px',
  marginTop: '0',
}

const infoBox = {
  backgroundColor: '#fefce8',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  border: '1px solid #fef08a',
}

const infoTitle = {
  color: '#854d0e',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '4px',
  marginTop: '0',
}

const infoText = {
  color: '#a16207',
  fontSize: '13px',
  lineHeight: '1.5',
  marginTop: '0',
  marginBottom: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const button = {
  backgroundColor: '#ef4444',
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

export default PaymentFailedEmail
