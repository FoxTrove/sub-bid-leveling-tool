"use client"

import { HelpCircle } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "What file types can I upload?",
    answer:
      "BidLevel supports PDF files, Excel spreadsheets (.xlsx, .xls), Word documents (.docx, .doc), and CSV files. Most subcontractor bids come in these formats, and our AI is trained to extract data from all of them accurately.",
  },
  {
    question: "How accurate is the AI analysis?",
    answer:
      "Our AI achieves over 95% accuracy in extracting scope items and pricing from bid documents. Each extracted item includes a confidence score, and anything below our threshold is flagged for your review. We continuously improve our models based on user feedback.",
  },
  {
    question: "Is my bid data secure?",
    answer:
      "Absolutely. All documents are encrypted in transit (TLS 1.3) and at rest (AES-256). Your data is stored on SOC 2 compliant servers, and we never share your bid information with anyone. Documents can be automatically deleted after processing if you prefer.",
  },
  {
    question: "How long does analysis take?",
    answer:
      "Most bid comparisons complete in 1-3 minutes, depending on the number of documents and their complexity. You'll see a real-time progress indicator and receive a notification when your analysis is ready.",
  },
  {
    question: "Can I compare bids from different trades?",
    answer:
      "Yes! BidLevel works with any trade—electrical, plumbing, HVAC, mechanical, concrete, you name it. The AI understands trade-specific terminology and scope items, ensuring accurate comparisons regardless of the specialty.",
  },
  {
    question: "What if a contractor's bid format is unusual?",
    answer:
      "Our AI is trained on thousands of bid formats and can handle most variations. If something looks unclear, it will be flagged with a lower confidence score for your review. You can also manually edit any extracted data if needed.",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes! Every new account gets 5 free bid comparisons—no credit card required. This lets you experience the full power of BidLevel on real projects before committing to a subscription or credit pack.",
  },
  {
    question: "Can I export the comparison results?",
    answer:
      "Absolutely. You can export your bid comparison as a professional PDF report, perfect for sharing with project owners, architects, or your internal team. The report includes the full analysis, recommendations, and scope gap summary.",
  },
]

export function FAQSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 mb-4">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Everything you need to know about BidLevel
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white border border-slate-200 rounded-xl px-6 data-[state=open]:shadow-lg data-[state=open]:border-slate-300 transition-all"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6 text-slate-900">
                  <span className="font-medium pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
