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

interface SubscriptionCanceledEmailProps {
  firstName: string
  planName: string
  accessEndsDate: string
}

export function SubscriptionCanceledEmail({
  firstName,
  planName,
  accessEndsDate,
}: SubscriptionCanceledEmailProps) {
  const previewText = `Your BidVet ${planName} subscription has been canceled`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="160" height="45" alt="BidVet" style={logo} />
          </Section>

          <Heading style={h1}>Subscription Canceled</Heading>

          <Text style={text}>
            Hi {firstName || 'there'},
          </Text>

          <Text style={text}>
            Your BidVet {planName} subscription has been canceled. We're sorry to see you go.
          </Text>

          <Section style={infoBox}>
            <Text style={infoTitle}>What happens now:</Text>
            <Text style={infoText}>
              <strong>Your access continues until:</strong> {accessEndsDate}
            </Text>
            <Text style={infoText}>
              <strong>Your data is safe:</strong> All your projects, comparisons, and documents will remain accessible.
            </Text>
            <Text style={infoText}>
              <strong>After your access ends:</strong> You can still view past results, but running new comparisons will require credits or a subscription.
            </Text>
          </Section>

          <Section style={optionsBox}>
            <Text style={optionsTitle}>Ways to continue using BidVet:</Text>
            <Text style={optionItem}>
              <strong>Buy credits</strong> — Pay only when you need a comparison (~$7/comparison)
            </Text>
            <Text style={optionItem}>
              <strong>Bring your own key</strong> — Use your OpenAI API key (~$1-3/comparison)
            </Text>
            <Text style={optionItem}>
              <strong>Resubscribe</strong> — Get unlimited access again anytime
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://bidvet.foxtrove.ai/pricing">
              View Options
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={feedbackText}>
            <strong>Quick question:</strong> What made you cancel? We'd love to hear your feedback—just reply to this email.
          </Text>

          <Text style={subtext}>
            Changed your mind?{' '}
            <Link href="https://bidvet.foxtrove.ai/settings" style={link}>
              Resubscribe anytime
            </Link>{' '}
            from your settings.
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
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  border: '1px solid #fcd34d',
}

const infoTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const infoText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '8px',
  marginTop: '0',
}

const optionsBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
}

const optionsTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '12px',
  marginTop: '0',
}

const optionItem = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.6',
  marginBottom: '8px',
  marginTop: '0',
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

const feedbackText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '16px',
  padding: '12px 16px',
  backgroundColor: '#f8fafc',
  borderRadius: '6px',
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

export default SubscriptionCanceledEmail
