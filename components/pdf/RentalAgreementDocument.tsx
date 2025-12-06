import React from 'react'
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.5 },
  header: { flexDirection: 'row', marginBottom: 20, borderBottom: 1, borderColor: '#000', paddingBottom: 10, alignItems: 'center' },
  headerText: { flexDirection: 'column' },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#003366' },
  logo: { width: 48, height: 48, marginRight: 10 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginVertical: 10, textTransform: 'uppercase', textDecoration: 'underline' },
  section: { marginBottom: 10, border: 1, borderColor: '#000', padding: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', backgroundColor: '#f0f0f0', padding: 4, marginBottom: 8, borderBottom: 1, borderColor: '#000' },
  row: { flexDirection: 'row', marginBottom: 4 },
  col: { flexGrow: 1 },
  label: { fontSize: 8, color: '#555', marginBottom: 2 },
  value: { fontSize: 10, fontWeight: 'bold', borderBottom: 1, borderColor: '#ccc', minHeight: 14 },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', marginTop: 5 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000', padding: 5 },
  disclaimer: { fontSize: 8, marginTop: 5, fontStyle: 'italic' },
  signatureSection: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between' }
})

export const RentalAgreementDocument = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image src="/SriRent%20Bike.jpg" style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={styles.companyName}>SRIRENT BIKE</Text>
          <Text>Hotline: +94 70 498 4008</Text>
          <Text>Embilipitiya, Sri Lanka</Text>
        </View>
      </View>
      <Text style={styles.title}>RENTAL AGREEMENT</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>01. THE RENTER (CUSTOMER DETAILS)</Text>
        <View style={styles.row}>
          <View style={[styles.col, { marginRight: 10 }]}>
            <Text style={styles.label}>FIRST NAME</Text>
            <Text style={styles.value}>{data.customer.firstName}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>LAST NAME</Text>
            <Text style={styles.value}>{data.customer.lastName}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.col, { marginRight: 10 }]}>
            <Text style={styles.label}>NATIONALITY</Text>
            <Text style={styles.value}>{data.customer.nationality}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>DOC NO</Text>
            <Text style={styles.value}>{data.customer.docNumber}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>HOME ADDRESS</Text>
            <Text style={styles.value}>{data.customer.address}</Text>
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>02. THE VEHICLE</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.label}>MAKE</Text><Text>{data.bike?.make}</Text></View>
            <View style={styles.tableCol}><Text style={styles.label}>MODEL</Text><Text>{data.bike?.model}</Text></View>
            <View style={styles.tableCol}><Text style={styles.label}>COLOR</Text><Text>{data.bike?.color}</Text></View>
            <View style={styles.tableCol}><Text style={styles.label}>PLATE NO</Text><Text>{data.bike?.plateNo}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.label}>ENGINE NO</Text><Text>{data.bike?.engineNo}</Text></View>
            <View style={{ ...styles.tableCol, width: '50%' }}><Text style={styles.label}>CHASSIS NO</Text><Text>{data.bike?.chassisNo}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: '100%' }}><Text style={styles.label}>FUEL LEVEL</Text><Text>{data.agreement?.fuelLevel}</Text></View>
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>03. RENTAL PERIOD & RATES</Text>
        <View style={styles.row}>
          <View style={styles.col}><Text>Start: {data.rental?.startDate}</Text></View>
          <View style={styles.col}><Text>End: {data.rental?.endDate}</Text></View>
        </View>
        <View style={{ marginTop: 10 }}><Text style={{ fontWeight: 'bold' }}>TOTAL: {data.rental?.total}</Text></View>
      </View>
      <View style={styles.signatureSection}>
        <View style={{ width: '40%', borderTop: 1 }}><Text style={{ textAlign: 'center', marginTop: 5 }}>OWNER</Text></View>
        <View style={{ width: '40%', borderTop: 1 }}><Text style={{ textAlign: 'center', marginTop: 5 }}>RENTER</Text></View>
      </View>
    </Page>
  </Document>
)
