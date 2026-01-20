import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold tracking-tight mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 15, 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using BidVet ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              BidVet provides an AI-powered tool for comparing and leveling subcontractor bids. 
              The Service analyzes uploaded documents to identify scope gaps and normalize pricing for comparison purposes.
            </p>
          </section>

          <section className="mb-8 p-6 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-semibold mb-4 text-red-600 dark:text-red-400">3. IMPORTANT DISCLAIMER: Construction Estimates</h2>
            <p className="font-medium mb-4">
              THE SERVICE IS A TOOL TO ASSIST IN THE ESTIMATION PROCESS, NOT A REPLACEMENT FOR PROFESSIONAL JUDGMENT.
            </p>
            <p className="mb-4">
              You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                The Service uses Artificial Intelligence to analyze data, which may result in errors, omissions, or "hallucinations."
              </li>
              <li>
                You represent and warrant that you will verify all data, calculations, scope items, and exclusions independently before relying on them for any commercial purpose, including but not limited to submitting bids, signing contracts, or procuring materials.
              </li>
              <li>
                BidVet shall not be liable for any errors in estimation, missed scope items, incorrect pricing, or any financial losses resulting from the use of the Service.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
            <p>
              To access the Service, you must create an account. You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account or password.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of BidVet and its licensors. 
              The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
            </p>
            <p className="mt-4">
              You retain all rights to the documents and data you upload to the Service ("User Content"). 
              By uploading User Content, you grant BidVet a license to use, reproduce, and process such content solely for the purpose of providing the Service to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p>
              In no event shall BidVet, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, 
              including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from 
              (i) your access to or use of or inability to access or use the Service; 
              (ii) any conduct or content of any third party on the Service; 
              (iii) any content obtained from the Service; and 
              (iv) unauthorized access, use or alteration of your transmissions or content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, 
              you agree to be bound by the revised terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at: support@bidvet.com
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
