# Abhii Karke Deta Hu — Multi-Source Analytics & Dashboard Platform

> **"Turn your data into insights — without the complexity."**

**Abhii Karke Deta Hu** is a modern, production-grade SaaS analytics and dashboard platform inspired by the principles of Power BI. It prioritizes clean visual workflows, blazing-fast dynamic MySQL storage, drag-and-drop report building, smart automated chart recommendations, and interactive multi-widget dashboard canvases.

---

## Key Features

1. **Connector Architecture (14 Sources Supported)**:
   - **Files**: Excel (`.xlsx`, `.xls`), CSV, JSON, XML, PDF tabular extraction.
   - **Databases**: MySQL, PostgreSQL, MongoDB.
   - **Cloud**: Google Sheets (live public or shared sheet import), Google Drive, Microsoft OneDrive, Dropbox, Amazon S3.
   - **APIs**: REST API (with Bearer/API Key auth & JSON path extraction), GraphQL API.

2. **Smart Dataset Profiling & MySQL Dynamic Tables**:
   - Ingested datasets automatically generate isolated dynamic MySQL tables (`ds_<dataset_id>`).
   - Automated data type detection (`number`, `string`, `date`, `boolean`).
   - Profiling metrics: null counts, distinct cardinality, sample values.
   - Interactive preview table: rename display names, hide columns, override detected types before confirming import.

3. **Power BI-Inspired Visual Report Builder**:
   - **Fields List**: Separated into Dimensions (Categorical / Date) and Measures (Numeric).
   - **Canvas**: Live Apache ECharts rendering with instant interactive tooltips, gradients, and responsiveness.
   - **Drop Zones (`@dnd-kit`)**:
     - X Axis / Category
     - Y Axis / Values
     - Legend / Group By (secondary dimension)
     - Value Filters
   - **Aggregations**: `SUM`, `AVG`, `COUNT`, `MIN`, `MAX`, `DISTINCT COUNT`.
   - **AI / Rule-Based Recommendations**: Automatically suggests Bar, Column, Line, Area, Donut, Pie, Scatter, KPI Card, or Data Table based on field cardinality and types.

4. **Multi-Widget Dashboard Canvas**:
   - Assemble multiple visual charts, KPI metric cards, and data tables on one interactive board.
   - **Global Cross-Widget Filters**: Apply filters across all charts linked to a dataset simultaneously.
   - Full persistence: Reopen, duplicate, edit widget titles, and save complete dashboard states to MySQL.
   - Print & PDF Export support.

5. **Security & Production Readiness**:
   - Password hashing with `bcryptjs`.
   - JWT session management with protected routes and Axios auth interceptor.
   - Parameterized SQL queries to eliminate SQL injection risks.
   - Strict SQL identifier sanitization for dynamic analytics tables and columns.
   - 1-Click Demo Login preloaded with sample e-commerce and historical datasets.

---

## Project Structure

```text
abhii-karke-deta-hu/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL pool & parameterized helpers
│   ├── connectors/               # Unified connector engine
│   │   ├── BaseConnector.js
│   │   ├── fileConnectors.js
│   │   ├── databaseConnectors.js
│   │   ├── cloudConnectors.js
│   │   ├── apiConnectors.js
│   │   └── index.js
│   ├── controllers/              # REST controllers
│   ├── database/
│   │   └── initDb.js             # DDL migrations & demo seeders
│   ├── middleware/               # Auth, Multer upload, error handling
│   ├── routes/                   # Express routes
│   ├── services/                 # Profiler, dynamic tables, query engine, recommender
│   ├── utils/                    # SQL sanitizer & validators
│   ├── server.js                 # Express server entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/           # ECharts ChartRenderer, KPI Card, DataTable
│   │   │   ├── dashboard/        # DashboardWidget, GlobalFiltersBar, AddWidgetModal
│   │   │   ├── data-source/      # ConnectorCard, FileUploadArea, ConnectionModal
│   │   │   ├── layout/           # Navbar, Sidebar, AppLayout
│   │   │   ├── report-builder/   # DraggableField, DropZone, ChartTypePicker
│   │   │   └── ui/
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── pages/                # Landing, Login, Register, Home, Datasets, DataSources, Preview, ReportBuilder, Dashboards
│   │   ├── services/             # Axios API client services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seeds.sql
├── test_e2e.js                   # Automated end-to-end integration test runner
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server 8.0+ or compatible MySQL database (e.g. TiDB Cloud, AWS RDS)

### 1. Database Setup
Configure your database credentials in `backend/.env`. (Default is pre-configured to a verified cloud MySQL host):
```ini
PORT=5000
DATABASE_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DATABASE_PORT=4000
DATABASE_USER=2KnMwGVpRDDzt4G.root
DATABASE_PASSWORD=So9dd1aMnmyE9XcF
DATABASE_NAME=abhii_karke_deta_hu
DATABASE_SSL=true
JWT_SECRET=abhii_karke_deta_hu_super_secret_jwt_key_2026_modern_analytics
```
*To use local MySQL, set `DATABASE_HOST=localhost`, `DATABASE_PORT=3306`, `DATABASE_SSL=false`, and your local password.*

### 2. Backend Installation & Run
```bash
cd backend
npm install
npm start
```
The server will automatically initialize all relational tables and seed the demo data.

### 3. Frontend Installation & Run
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Testing & Verification
Run the automated end-to-end integration test:
```bash
node test_e2e.js
```
This tests:
- Database connectivity & health endpoints
- Demo authentication & JWT authorization
- Connectors catalog listing
- Real Excel file uploading & automatic MySQL table creation
- Parameterized aggregation query engine (`SUM`, `AVG`, etc.)
- Recommendation engine
- Dashboard state retrieval and widget persistence.
