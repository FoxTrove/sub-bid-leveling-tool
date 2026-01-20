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

interface HandshakeWelcomeEmailProps {
  firstName: string
}

export function HandshakeWelcomeEmail({ firstName }: HandshakeWelcomeEmailProps) {
  const previewText = 'Welcome to BidVet - You have exclusive partner access'

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="160" height="45" alt="BidVet" style={logo} />
          </Section>

          <Section style={partnerBadge}>
            <Text style={badgeText}>HANDSHAKE PARTNER</Text>
          </Section>

          <Heading style={h1}>Welcome to BidVet!</Heading>

          <Text style={text}>
            Hi {firstName || 'there'},
          </Text>

          <Text style={text}>
            You're in. As a HANDSHAKE partner, you have access to the same AI-powered bid leveling tool that other GCs pay $99-299/month for—but you'll never pay us a subscription fee.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightTitle}>Your exclusive partner deal:</Text>
            <Text style={highlightText}>
              <strong>First 30 days:</strong> Completely free. We cover all AI costs so you can try everything with zero risk.
            </Text>
            <Text style={highlightText}>
              <strong>After 30 days:</strong> Still free to use BidVet. You just bring your own OpenAI API key and pay OpenAI directly—typically $1-3 per comparison.
            </Text>
            <Text style={highlightText}>
              <strong>Bottom line:</strong> No subscription. No monthly fees to us. Ever. You only pay for what you use, directly to OpenAI.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://bidvet.foxtrove.ai/dashboard">
              Start Your First Comparison
            </Button>
          </Section>

          <Text style={text}>
            <strong>Quick tip:</strong> Upload 2-5 subcontractor bids in PDF, Excel, or Word format. Our AI will analyze them, identify scope gaps, and recommend the best value.
          </Text>

          <Hr style={hr} />

          <Text style={subtext}>
            Questions? Just reply to this email or reach out to{' '}
            <Link href="mailto:kyle@tryelderconstruction.com" style={link}>
              kyle@tryelderconstruction.com
            </Link>
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

const partnerBadge = {
  textAlign: 'center' as const,
  marginBottom: '16px',
}

const badgeText = {
  display: 'inline-block',
  backgroundColor: '#065f46',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1px',
  padding: '6px 12px',
  borderRadius: '4px',
  margin: '0',
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

const highlightBox = {
  backgroundColor: '#ecfdf5',
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

const subtext = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '1.5',
}

const link = {
  color: '#10b981',
  textDecoration: 'underline',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  marginTop: '24px',
}

export default HandshakeWelcomeEmail
