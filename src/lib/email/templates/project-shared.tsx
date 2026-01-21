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

interface ProjectSharedEmailProps {
  recipientName: string
  sharedBy: string
  projectName: string
  permission: 'view' | 'comment' | 'edit'
  projectUrl: string
}

const permissionLabels: Record<string, string> = {
  view: 'view',
  comment: 'view and comment on',
  edit: 'view, comment, and edit',
}

export function ProjectSharedEmail({
  recipientName,
  sharedBy,
  projectName,
  permission,
  projectUrl,
}: ProjectSharedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{sharedBy} shared "{projectName}" with you</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Project Shared With You</Heading>

          <Text style={text}>
            Hi {recipientName},
          </Text>

          <Text style={text}>
            <strong>{sharedBy}</strong> has shared the bid comparison <strong>"{projectName}"</strong> with you.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              📄 <strong>Project:</strong> {projectName}
            </Text>
            <Text style={highlightText}>
              👤 <strong>Shared by:</strong> {sharedBy}
            </Text>
            <Text style={highlightText}>
              🔑 <strong>Access:</strong> You can {permissionLabels[permission]} this project
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={projectUrl}>
              View Project
            </Button>
          </Section>

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
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #bfdbfe',
}

const highlightText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
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
