import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import type { Project, BidDocumentWithItems, ComparisonResult, ExtractedItem } from "@/types"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tableHeader: {
    backgroundColor: "#f5f5f5",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 8,
    flex: 1,
  },
  tableCellWide: {
    padding: 8,
    flex: 2,
  },
  summaryCard: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  recommendation: {
    backgroundColor: "#e8f4e8",
    padding: 16,
    borderRadius: 4,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 8,
  },
  recommendationText: {
    color: "#166534",
  },
  warning: {
    backgroundColor: "#fef3c7",
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  warningText: {
    color: "#92400e",
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#999",
    fontSize: 8,
  },
  gap: {
    backgroundColor: "#fef9c3",
    padding: 4,
  },
  excluded: {
    color: "#dc2626",
  },
  included: {
    color: "#16a34a",
  },
  contractorHeader: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0369a1",
  },
  contractorSubtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  exclusionBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    padding: 10,
    marginBottom: 12,
    borderRadius: 4,
  },
  exclusionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 6,
  },
  exclusionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  categoryHeader: {
    backgroundColor: "#f1f5f9",
    padding: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#475569",
  },
  lineItem: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 4,
  },
  lineItemDesc: {
    flex: 3,
    fontSize: 9,
  },
  lineItemQty: {
    flex: 1,
    fontSize: 9,
    textAlign: "center",
  },
  lineItemPrice: {
    flex: 1,
    fontSize: 9,
    textAlign: "right",
  },
  totalsBox: {
    backgroundColor: "#f8fafc",
    padding: 10,
    marginTop: 12,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalLabel: {
    fontSize: 10,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    marginTop: 4,
    paddingTop: 4,
  },
})

interface ProfileInfo {
  full_name: string | null
  company_name: string | null
  gc_name: string | null
}

interface FolderInfo {
  name: string
  client_name: string | null
  location: string | null
  project_size: string | null
}

interface PDFGeneratorProps {
  project: Project
  documents: BidDocumentWithItems[]
  results: ComparisonResult
  profile?: ProfileInfo
  folder?: FolderInfo
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "-"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ComparisonReportPDF({
  project,
  documents,
  results,
  profile,
  folder,
}: PDFGeneratorProps) {
  const summary = results.summary_json
  const recommendation = results.recommendation_json

  // Determine location from folder or project
  const location = folder?.location || project.location

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Company/Project Info */}
        <View style={styles.header}>
          {/* Company info row */}
          {(profile?.company_name || profile?.gc_name) && (
            <View style={{ marginBottom: 8 }}>
              {profile?.company_name && (
                <Text style={{ fontSize: 11, fontWeight: "bold", color: "#374151" }}>
                  {profile.company_name}
                </Text>
              )}
              {profile?.gc_name && (
                <Text style={{ fontSize: 9, color: "#6b7280" }}>
                  GC: {profile.gc_name}
                </Text>
              )}
            </View>
          )}

          {/* Project title */}
          <Text style={styles.title}>{project.name}</Text>

          {/* Project details row */}
          <Text style={styles.subtitle}>
            {project.trade_type}
            {location ? ` | ${location}` : ""}
            {folder?.project_size ? ` | ${folder.project_size}` : ""}
          </Text>

          {/* Client info */}
          {folder?.client_name && (
            <Text style={{ fontSize: 10, color: "#4b5563", marginTop: 2 }}>
              Client: {folder.client_name}
            </Text>
          )}

          {/* Generation date */}
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString()}
            {profile?.full_name ? ` by ${profile.full_name}` : ""}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Text style={styles.summaryLabel}>Bids Compared</Text>
              <Text style={styles.summaryValue}>{results.total_bids}</Text>
            </View>
            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Text style={styles.summaryLabel}>Price Range</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(results.price_low)} -{" "}
                {formatCurrency(results.price_high)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Text style={styles.summaryLabel}>Scope Gaps</Text>
              <Text style={styles.summaryValue}>{results.gap_items}</Text>
            </View>
          </View>
        </View>

        {/* Recommendation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Recommendation</Text>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>
              Recommended: {recommendation.recommended_contractor_name}
            </Text>
            <Text style={styles.recommendationText}>
              {recommendation.reasoning}
            </Text>
          </View>
          {recommendation.warnings.length > 0 && (
            <View>
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                Warnings:
              </Text>
              {recommendation.warnings.map((warning, index) => (
                <View key={index} style={styles.warning}>
                  <Text style={styles.warningText}>{warning.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Contractor Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contractor Comparison</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellWide}>Contractor</Text>
              <Text style={styles.tableCell}>Base Bid</Text>
              <Text style={styles.tableCell}>Items</Text>
              <Text style={styles.tableCell}>Exclusions</Text>
            </View>
            {summary.contractors.map((contractor) => (
              <View key={contractor.id} style={styles.tableRow}>
                <Text style={styles.tableCellWide}>{contractor.name}</Text>
                <Text style={styles.tableCell}>
                  {formatCurrency(contractor.total_bid)}
                </Text>
                <Text style={styles.tableCell}>{contractor.item_count}</Text>
                <Text style={styles.tableCell}>
                  {contractor.exclusion_count}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Scope Gaps */}
        {summary.scope_gaps && summary.scope_gaps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scope Gaps</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCellWide}>Item</Text>
                <Text style={styles.tableCellWide}>Missing From</Text>
                <Text style={styles.tableCell}>Est. Value</Text>
              </View>
              {summary.scope_gaps.slice(0, 10).map((gap, index) => (
                <View key={index} style={[styles.tableRow, styles.gap]}>
                  <Text style={styles.tableCellWide}>{gap.description}</Text>
                  <Text style={styles.tableCellWide}>
                    {gap.missing_from
                      .map(
                        (id) =>
                          documents.find((d) => d.id === id)?.contractor_name ||
                          "Unknown"
                      )
                      .join(", ")}
                  </Text>
                  <Text style={styles.tableCell}>
                    {formatCurrency(gap.estimated_value)}
                  </Text>
                </View>
              ))}
            </View>
            {summary.scope_gaps.length > 10 && (
              <Text style={{ marginTop: 4, color: "#666", fontSize: 9 }}>
                ... and {summary.scope_gaps.length - 10} more gaps
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Powered by Foxtrove.ai | This report is AI-generated. Verify all
          information before making decisions.
        </Text>
      </Page>

      {/* Detailed Contractor Pages */}
      {documents.map((doc) => {
        const items = doc.extracted_items || []
        const inclusions = items.filter((i) => !i.is_exclusion)
        const exclusions = items.filter((i) => i.is_exclusion)

        // Group inclusions by category
        const byCategory = new Map<string, ExtractedItem[]>()
        for (const item of inclusions) {
          const cat = item.category || "General"
          if (!byCategory.has(cat)) {
            byCategory.set(cat, [])
          }
          byCategory.get(cat)!.push(item)
        }
        const categories = Array.from(byCategory.entries()).sort((a, b) =>
          a[0].localeCompare(b[0])
        )

        const baseTotal = inclusions.reduce(
          (sum, i) => sum + (i.total_price || 0),
          0
        )
        const exclusionsTotal = exclusions.reduce(
          (sum, i) => sum + (i.total_price || 0),
          0
        )
        const isRecommended =
          recommendation.recommended_contractor_id === doc.id

        return (
          <Page key={doc.id} size="A4" style={styles.page}>
            {/* Contractor Header */}
            <View style={styles.contractorHeader}>
              <Text style={styles.contractorName}>
                {doc.contractor_name}
                {isRecommended ? " (RECOMMENDED)" : ""}
              </Text>
              <Text style={styles.contractorSubtitle}>
                {items.length} line items | Base Bid:{" "}
                {formatCurrency(baseTotal)}
              </Text>
            </View>

            {/* Exclusions Box - Show First */}
            {exclusions.length > 0 && (
              <View style={styles.exclusionBox}>
                <Text style={styles.exclusionTitle}>
                  EXCLUSIONS (Not Included in Base Bid)
                </Text>
                {exclusions.map((item, index) => (
                  <View key={index} style={styles.exclusionItem}>
                    <Text style={{ fontSize: 9, flex: 3 }}>
                      {item.description}
                    </Text>
                    <Text style={{ fontSize: 9, flex: 1, textAlign: "right" }}>
                      {item.total_price
                        ? formatCurrency(item.total_price)
                        : "TBD"}
                    </Text>
                  </View>
                ))}
                <View
                  style={[
                    styles.exclusionItem,
                    { borderTopWidth: 1, borderTopColor: "#fecaca", marginTop: 4, paddingTop: 4 },
                  ]}
                >
                  <Text style={{ fontSize: 9, fontWeight: "bold", flex: 3 }}>
                    Total Exclusions
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "bold",
                      flex: 1,
                      textAlign: "right",
                    }}
                  >
                    {formatCurrency(exclusionsTotal)}
                  </Text>
                </View>
              </View>
            )}

            {/* Included Items by Category */}
            <Text style={styles.sectionTitle}>Included Items</Text>
            {categories.map(([category, categoryItems]) => (
              <View key={category}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>
                    {category} ({formatCurrency(
                      categoryItems.reduce(
                        (sum, i) => sum + (i.total_price || 0),
                        0
                      )
                    )})
                  </Text>
                </View>
                {categoryItems.slice(0, 15).map((item, index) => (
                  <View key={index} style={styles.lineItem}>
                    <Text style={styles.lineItemDesc}>{item.description}</Text>
                    <Text style={styles.lineItemQty}>
                      {item.quantity || "-"} {item.unit || ""}
                    </Text>
                    <Text style={styles.lineItemPrice}>
                      {formatCurrency(item.total_price)}
                    </Text>
                  </View>
                ))}
                {categoryItems.length > 15 && (
                  <Text style={{ fontSize: 8, color: "#666", marginTop: 2 }}>
                    ... and {categoryItems.length - 15} more items
                  </Text>
                )}
              </View>
            ))}

            {/* Totals */}
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Base Bid Subtotal:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(baseTotal)}
                </Text>
              </View>
              {exclusionsTotal > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: "#dc2626" }]}>
                    Potential Exclusion Add-ons:
                  </Text>
                  <Text style={[styles.totalValue, { color: "#dc2626" }]}>
                    +{formatCurrency(exclusionsTotal)}
                  </Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>
                  Estimated True Cost:
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(baseTotal + exclusionsTotal)}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
              Powered by Foxtrove.ai | This report is AI-generated. Verify all
              information before making decisions.
            </Text>
          </Page>
        )
      })}
    </Document>
  )
}
