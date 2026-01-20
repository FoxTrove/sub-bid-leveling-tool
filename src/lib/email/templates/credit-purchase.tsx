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

interface CreditPurchaseEmailProps {
  firstName: string
  packName: string
  creditsAmount: number
  amountPaid: number
  newBalance: number
}

export function CreditPurchaseEmail({
  firstName,
  packName,
  creditsAmount,
  amountPaid,
  newBalance,
}: CreditPurchaseEmailProps) {
  const previewText = `Your ${packName} credit pack is ready - ${creditsAmount} comparisons added`

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

          <Heading style={h1}>Credits Added!</Heading>

          <Text style={text}>
            Hi {firstName || 'there'},
          </Text>

          <Text style={text}>
            Your purchase was successful. We've added {creditsAmount} comparison credits to your account.
          </Text>

          <Section style={receiptBox}>
            <Text style={receiptTitle}>Purchase Receipt</Text>
            <div style={receiptRow}>
              <Text style={receiptLabel}>{packName} Pack</Text>
              <Text style={receiptValue}>${amountPaid}</Text>
            </div>
            <div style={receiptDivider} />
            <div style={receiptRow}>
              <Text style={receiptLabel}>Credits added</Text>
              <Text style={receiptValueHighlight}>+{creditsAmount}</Text>
            </div>
          </Section>

          <Section style={balanceBox}>
            <Text style={balanceLabel}>Your new credit balance</Text>
            <Text style={balanceValue}>{newBalance} credits</Text>
            <Text style={balanceSubtext}>Use them for up to {newBalance} bid comparisons</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href="https://bidlevel.foxtrove.ai/compare/new">
              Start a Comparison
            </Button>
          </Section>

          <Section style={infoBox}>
            <Text style={infoTitle}>How credits work</Text>
            <Text style={infoText}>
              Each comparison uses 1 credit, regardless of how many bids you upload. Credits never expire.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={subtext}>
            Need more credits?{' '}
            <Link href="https://bidlevel.foxtrove.ai/pricing" style={link}>
              View credit packs
            </Link>
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

const receiptBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  border: '1px solid #e2e8f0',
}

const receiptTitle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '16px',
  marginTop: '0',
}

const receiptRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const receiptLabel = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0',
}

const receiptValue = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const receiptValueHighlight = {
  color: '#10b981',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
}

const receiptDivider = {
  borderTop: '1px solid #e2e8f0',
  margin: '12px 0',
}

const balanceBox = {
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  textAlign: 'center' as const,
  border: '1px solid #a7f3d0',
}

const balanceLabel = {
  color: '#065f46',
  fontSize: '12px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: '4px',
  marginTop: '0',
}

const balanceValue = {
  color: '#047857',
  fontSize: '36px',
  fontWeight: '700',
  marginTop: '0',
  marginBottom: '4px',
}

const balanceSubtext = {
  color: '#10b981',
  fontSize: '13px',
  marginTop: '0',
  marginBottom: '0',
}

const infoBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
}

const infoTitle = {
  color: '#475569',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '4px',
  marginTop: '0',
}

const infoText = {
  color: '#64748b',
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

export default CreditPurchaseEmail
