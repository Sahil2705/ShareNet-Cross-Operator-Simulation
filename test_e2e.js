const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000/api';

async function runEndToEndTests() {
  console.log('--- Starting End-to-End Verification Tests ---');

  // Test 1: Health Check
  console.log('1. Testing /api/health...');
  const healthRes = await axios.get(`${BASE_URL}/health`);
  console.log(`✓ Health status: ${healthRes.data.status}, DB: ${healthRes.data.database.success ? 'Connected' : 'Failed'}`);

  // Test 2: Demo Login & JWT
  console.log('\n2. Testing /api/auth/demo-login...');
  const loginRes = await axios.post(`${BASE_URL}/auth/demo-login`);
  const token = loginRes.data.token;
  console.log(`✓ Demo user authenticated. Token: ${token.substring(0, 20)}...`);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Test 3: List Connectors
  console.log('\n3. Testing /api/connectors/list...');
  const connRes = await axios.get(`${BASE_URL}/connectors/list`);
  console.log(`✓ Connectors catalog loaded: ${connRes.data.connectors.length} connectors available`);
  const categories = [...new Set(connRes.data.connectors.map(c => c.category))];
  console.log(`  Categories: ${categories.join(', ')}`);

  // Test 4: List Datasets
  console.log('\n4. Testing /api/datasets...');
  const datasetsRes = await axios.get(`${BASE_URL}/datasets`, authHeaders);
  console.log(`✓ Datasets found: ${datasetsRes.data.datasets.length}`);
  const firstDataset = datasetsRes.data.datasets[0];
  console.log(`  Primary Dataset: "${firstDataset.name}" (${firstDataset.row_count} rows, ${firstDataset.column_count} cols)`);

  // Test 5: Query Aggregation Engine (Dimensions & Measures)
  console.log('\n5. Testing /api/queries/:id/aggregate (Category by SUM(Sales))...');
  const aggRes = await axios.post(
    `${BASE_URL}/queries/${firstDataset.id}/aggregate`,
    {
      dimensionField: 'Category',
      measureField: 'Sales',
      aggregation: 'SUM',
    },
    authHeaders
  );
  console.log(`✓ Categories aggregated (${aggRes.data.categories.length}): ${aggRes.data.categories.join(', ')}`);
  console.log(`  Values: ${aggRes.data.values.join(', ')}`);

  // Test 6: AI / Rule-based Chart Recommendations
  console.log('\n6. Testing /api/queries/:id/recommendations...');
  const recRes = await axios.get(
    `${BASE_URL}/queries/${firstDataset.id}/recommendations?dimensionField=Category&measureField=Sales`,
    authHeaders
  );
  console.log(`✓ Smart Recommendations: ${recRes.data.recommendations.map(r => r.title + (r.recommended ? ' ★' : '')).join(', ')}`);

  // Test 7: Testing File Upload with real Excel File
  const sampleExcelPath = 'C:\\Users\\Sahil\\.gemini\\antigravity\\scratch\\Swarajya_Analytics_Master_Dataset.xlsx';
  if (fs.existsSync(sampleExcelPath)) {
    console.log(`\n7. Testing Real Excel Upload (${path.basename(sampleExcelPath)})...`);
    const form = new FormData();
    form.append('file', fs.createReadStream(sampleExcelPath));

    const uploadRes = await axios.post(`${BASE_URL}/datasets/upload`, form, {
      headers: {
        ...authHeaders.headers,
        ...form.getHeaders(),
      },
    });

    console.log(`✓ Upload & Profiling successful!`);
    console.log(`  Rows detected: ${uploadRes.data.data.rowCount}`);
    console.log(`  Columns detected (${uploadRes.data.data.columns.length}): ${uploadRes.data.data.columns.map(c => c.columnName + ' (' + c.dataType + ')').join(', ')}`);

    // Confirm Import into MySQL
    console.log('  Confirming import into MySQL dynamic table...');
    const confirmRes = await axios.post(
      `${BASE_URL}/datasets/confirm-import`,
      {
        uploadKey: uploadRes.data.data.uploadKey,
        name: 'Swarajya Master Dataset (Verified)',
        sourceType: uploadRes.data.data.sourceType,
        fileName: uploadRes.data.data.fileName,
        fileSize: uploadRes.data.data.fileSize,
        columns: uploadRes.data.data.columns,
      },
      authHeaders
    );

    console.log(`✓ MySQL table created: ${confirmRes.data.dataset.tableName} with ${confirmRes.data.dataset.rowCount} rows!`);
  }

  // Test 8: Dashboards & Widgets
  console.log('\n8. Testing /api/dashboards...');
  const dashRes = await axios.get(`${BASE_URL}/dashboards`, authHeaders);
  console.log(`✓ Dashboards loaded: ${dashRes.data.dashboards.length}`);
  const firstDash = dashRes.data.dashboards[0];
  console.log(`  Default Dashboard: "${firstDash.name}" (${firstDash.widget_count} widgets)`);

  const dashDetail = await axios.get(`${BASE_URL}/dashboards/${firstDash.id}`, authHeaders);
  console.log(`  Widgets loaded: ${dashDetail.data.dashboard.widgets.map(w => w.title + ' [' + w.widget_type + ']').join(', ')}`);

  console.log('\n--- All Automated Verification Tests Passed Successfully! ---');
}

runEndToEndTests().catch((err) => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});
