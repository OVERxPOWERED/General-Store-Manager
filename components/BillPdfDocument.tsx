import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#1F2A24", paddingBottom: 12 },
  storeName: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  meta: { color: "#5B6660", fontSize: 10 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#DDD9CD", paddingVertical: 6 },
  headRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: "#1F2A24" },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  headText: { fontWeight: 700 },
  totalRow: { flexDirection: "row", marginTop: 12, justifyContent: "flex-end" },
  totalLabel: { marginRight: 16, fontWeight: 700 },
  totalValue: { fontWeight: 700 },
});

type BillItem = {
  quantity: number;
  priceAtSale: string | number;
  product: { name: string; sku: string };
};

type Bill = {
  billNumber: number;
  createdAt: string | Date;
  totalAmount: string | number;
  items: BillItem[];
};

export default function BillPdfDocument({ bill }: { bill: Bill }) {
  const date = new Date(bill.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.storeName}>General Store</Text>
          <Text style={styles.meta}>Bill #{bill.billNumber}</Text>
          <Text style={styles.meta}>{date}</Text>
        </View>

        <View style={styles.headRow}>
          <Text style={[styles.colName, styles.headText]}>Item</Text>
          <Text style={[styles.colQty, styles.headText]}>Qty</Text>
          <Text style={[styles.colPrice, styles.headText]}>Price</Text>
          <Text style={[styles.colTotal, styles.headText]}>Total</Text>
        </View>

        {bill.items.map((item, i) => {
          const price = Number(item.priceAtSale);
          return (
            <View style={styles.row} key={i}>
              <Text style={styles.colName}>{item.product.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{price.toFixed(2)}</Text>
              <Text style={styles.colTotal}>{(price * item.quantity).toFixed(2)}</Text>
            </View>
          );
        })}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {Number(bill.totalAmount).toFixed(2)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
