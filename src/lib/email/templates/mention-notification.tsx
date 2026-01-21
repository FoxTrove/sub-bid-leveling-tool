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

interface MentionNotificationEmailProps {
  recipientName: string
  mentionedBy: string
  projectName: string
  commentPreview: string
  projectUrl: string
}

export function MentionNotificationEmail({
  recipientName,
  mentionedBy,
  projectName,
  commentPreview,
  projectUrl,
}: MentionNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{mentionedBy} mentioned you in "{projectName}"</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You were mentioned</Heading>

          <Text style={text}>
            Hi {recipientName},
          </Text>

          <Text style={text}>
            <strong>{mentionedBy}</strong> mentioned you in a comment on <strong>"{projectName}"</strong>.
          </Text>

          <Section style={commentBox}>
            <Text style={commentLabel}>Comment:</Text>
            <Text style={commentContent}>"{commentPreview}"</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={projectUrl}>
              View Comment
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            BidVet by Foxtrove.ai
            <br />
            You received this because you were mentioned in a comment.
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

const commentBox = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '4px solid #2563eb',
}

const commentLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px 0',
}

const commentContent = {
  color: '#1e293b',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  fontStyle: 'italic' as const,
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
