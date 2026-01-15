import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import type { Project, BidDocument, ComparisonResult } from "@/types"

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
})

interface PDFGeneratorProps {
  project: Project
  documents: BidDocument[]
  results: ComparisonResult
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
}: PDFGeneratorProps) {
  const summary = results.summary_json
  const recommendation = results.recommendation_json

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{project.name}</Text>
          <Text style={styles.subtitle}>
            {project.trade_type}
            {project.location ? ` | ${project.location}` : ""}
          </Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString()}
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
    </Document>
  )
}
