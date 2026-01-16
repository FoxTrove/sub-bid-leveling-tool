import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Shield, Lock, Server, Trash2, Eye, FileText } from "lucide-react"

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 15, 2026</p>

          {/* Security Highlights */}
          <div className="not-prose mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
              <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">End-to-End Encryption</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">TLS 1.3 in transit, AES-256 at rest</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
              <Server className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">SOC 2 Compliant</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">Enterprise-grade infrastructure</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800">
              <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-violet-900 dark:text-violet-100 text-sm">Your Data Stays Yours</h4>
                <p className="text-xs text-violet-700 dark:text-violet-300">Never shared or sold</p>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              BidLevel ("we," "us," or "our") respects your privacy and is committed to protecting your personal data and business-sensitive documents.
              This privacy policy will inform you as to how we look after your personal data when you visit our website
              and use our bid leveling services, and tell you about your privacy rights and how the law protects you.
            </p>
            <p className="mt-4">
              We understand that as a construction professional, you are entrusting us with highly confidential business information—subcontractor bids, project costs,
              and client data. We take this responsibility extremely seriously and have implemented robust security measures to protect this information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. The Data We Collect</h2>
            <p className="mb-4">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
              <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform on the devices you use to access this website.</li>
              <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
              <li><strong>Bid Data:</strong> includes the construction documents, estimates, and subcontractor bids you upload for analysis.</li>
            </ul>
          </section>

          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold m-0">3. Document & Bid Data Protection</h2>
            </div>
            <p className="mb-4">
              We recognize that the bid documents you upload contain highly sensitive competitive information. Here's how we protect your documents:
            </p>

            <div className="not-prose bg-slate-50 dark:bg-slate-900 rounded-lg p-6 mb-4 border border-slate-200 dark:border-slate-800">
              <h4 className="font-semibold mb-4 text-lg">Document Security Measures</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Encryption at Rest:</strong>
                    <span className="text-slate-600 dark:text-slate-400"> All uploaded documents are encrypted using AES-256 encryption before being stored in our database.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Encryption in Transit:</strong>
                    <span className="text-slate-600 dark:text-slate-400"> All data transfers use TLS 1.3 encryption to protect your files during upload and download.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Access Control:</strong>
                    <span className="text-slate-600 dark:text-slate-400"> Your documents are accessible only to you. We implement strict row-level security policies ensuring no other user can access your data.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Data Deletion:</strong>
                    <span className="text-slate-600 dark:text-slate-400"> You can delete your projects and documents at any time. Deleted data is permanently removed from our systems within 30 days.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="not-prose bg-amber-50 dark:bg-amber-950/50 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-amber-900 dark:text-amber-100 text-sm">
                <strong>Important:</strong> We never share your bid documents, pricing information, or subcontractor details with other users, competitors, or third parties.
                Your competitive bid information remains strictly confidential.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Client & Subcontractor Information</h2>
            <p className="mb-4">
              We understand your documents may contain information about your clients, project owners, and subcontractors. We handle this third-party information with the same level of security as your own data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>No Data Mining:</strong> We do not mine, aggregate, or analyze client/subcontractor information across different users.</li>
              <li><strong>No Cross-Referencing:</strong> Subcontractor pricing from your bids is never cross-referenced or shared with other general contractors.</li>
              <li><strong>Isolated Processing:</strong> Each user's data is processed in isolation—your data never intersects with another user's data.</li>
              <li><strong>No Unauthorized Access:</strong> Our employees cannot access your documents without explicit authorization for support purposes.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. How We Use Your Data</h2>
            <p className="mb-4">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide the bid leveling service you have requested.</li>
              <li>To process and analyze uploaded documents using AI technologies.</li>
              <li>To manage your account and subscription.</li>
              <li>To improve our website, products/services, marketing or customer relationships.</li>
              <li>To comply with a legal or regulatory obligation.</li>
            </ul>
            <p className="mt-4">
              <strong>We never use your bid data to:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-red-700 dark:text-red-400">
              <li>Train machine learning models on your specific project data</li>
              <li>Share pricing information with competitors</li>
              <li>Create aggregate pricing databases</li>
              <li>Market to your subcontractors or clients</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Security Infrastructure</h2>
            <p className="mb-4">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>SOC 2 Type II Compliant:</strong> Our infrastructure meets rigorous security and availability standards.</li>
              <li><strong>Secure Cloud Hosting:</strong> Data is stored on enterprise-grade cloud infrastructure with automatic backups and redundancy.</li>
              <li><strong>Regular Security Audits:</strong> We conduct regular security assessments and penetration testing.</li>
              <li><strong>Employee Access Controls:</strong> Access to your data is limited to employees who have a business need to know, and all access is logged and audited.</li>
              <li><strong>Incident Response:</strong> We have procedures in place to detect, report, and investigate personal data breaches.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party AI Processing</h2>
            <p className="mb-4">
              Our service utilizes third-party AI providers (such as OpenAI) to process text and data from your uploaded documents. Here's what you need to know:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Data Processing Agreements:</strong> We have strict data processing agreements with our AI providers.</li>
              <li><strong>No Model Training:</strong> Your data is NOT used to train public AI models.</li>
              <li><strong>Ephemeral Processing:</strong> Document content is sent for analysis and discarded by the AI provider after processing.</li>
              <li><strong>API-Only Access:</strong> We use enterprise API tiers that provide additional privacy protections.</li>
            </ul>
            <p className="mt-4">
              If you provide your own OpenAI API key, your data is processed directly through your own OpenAI account, and we do not have visibility into that processing relationship.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p className="mb-4">We retain your data according to the following guidelines:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Active Account Data:</strong> Retained while your account is active and for 90 days after account closure.</li>
              <li><strong>Deleted Projects:</strong> Permanently removed within 30 days of deletion request.</li>
              <li><strong>Transaction Records:</strong> Retained for 7 years for legal and tax compliance.</li>
              <li><strong>Technical Logs:</strong> Automatically deleted after 90 days.</li>
            </ul>
            <p className="mt-4">
              You can request complete deletion of your account and all associated data at any time by contacting us at support@bidlevel.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Your Legal Rights</h2>
            <p className="mb-4">
              Under certain circumstances, you have rights under data protection laws in relation to your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right to Access:</strong> Request copies of your personal data.</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate personal data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data.</li>
              <li><strong>Right to Restrict Processing:</strong> Request restriction of processing of your personal data.</li>
              <li><strong>Right to Data Portability:</strong> Request transfer of your personal data.</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent where we rely on consent for processing.</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, please contact us at support@bidlevel.com. We will respond to your request within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. California Privacy Rights (CCPA)</h2>
            <p className="mb-4">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The right to know what personal information is being collected about you.</li>
              <li>The right to know whether your personal information is sold or disclosed and to whom.</li>
              <li>The right to opt-out of the sale of personal information.</li>
              <li>The right to non-discrimination for exercising your CCPA rights.</li>
            </ul>
            <p className="mt-4">
              <strong>Important:</strong> We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, our privacy practices, or wish to exercise your data protection rights, please contact us at:
            </p>
            <div className="not-prose mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-100">BidLevel Support</p>
              <p className="text-slate-600 dark:text-slate-400">Email: support@bidlevel.com</p>
              <p className="text-slate-600 dark:text-slate-400 mt-2">We aim to respond to all requests within 2 business days.</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
