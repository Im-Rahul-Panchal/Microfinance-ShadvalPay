import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/api";
import { useAuth } from "../../../contexts/AuthContext";
import MenuItems from "../../dashboard/MenuItems";
import Search from "../../dashboard/Search";
import Footer from "../../dashboard/Footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useLocation from "../../../hooks/useLocation";
import { BASE_URL } from "../../../config";
import { Table, Input, Button, Tag, Space } from "antd";
import { SearchOutlined, ExportOutlined } from "@ant-design/icons";
import debounce from "lodash.debounce";
import * as XLSX from "xlsx";

const { Search: AntSearch } = Input;

const CollectionReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latitude, longitude, loading: locationLoading } = useLocation();

  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
  );
  const [toDate, setToDate] = useState(new Date());
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");

  // Load Data
  const loadData = useCallback(async () => {
    if (!user?.userId || locationLoading || latitude === null || longitude === null) {
      toast.error("Location or user data not available.");
      return;
    }

    setLoading(true);
    setTableLoading(true);
    setError("");

    try {
      const payload = {
        userId: user.userId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        startDate: fromDate.toISOString().split("T")[0],
        endDate: toDate.toISOString().split("T")[0],
      };

      const response = await api.post(`${BASE_URL}/api/collectionReport`, payload);

      if (response.data?.resCode === "100" && Array.isArray(response.data.data)) {
        const mappedData = response.data.data.map((item) => ({
          key: item.loanId || Math.random(),
          branchName: item.branchName || "—",
          memberName: item.customerName || "—",
          memberCode: item.customerCode || "—",
          applyDate: item.applyDate || "—",
          loanName: item.loanType || "—",
          loanNo: item.loanCode || "—",
          loanAmount: parseFloat(item.loanAmount) || 0,
          emiAmount: parseFloat(item.emiAmount) || 0,
          loanDate: item.disburseDate || "—",
          loanPaidAmt: parseFloat(item.totalDeposit) || 0,
          loanDueAmt: parseFloat(item.totalDueBal) || 0,
          totalInstDues: parseInt(item.totalInstDues) || 0,
          loanId: item.loanId || item.ID,
        }));

        setData(mappedData);
        setFilteredData(mappedData);

        if (sessionStorage.getItem("skipToast") !== "true") {
          toast.success("Collection report loaded successfully!");
        }
        sessionStorage.removeItem("skipToast");
      } else {
        setData([]);
        setFilteredData([]);
        setError("No collection data found for the selected date range.");
        toast.error("No data available.");
      }
    } catch (err) {
      console.error("Error loading collection report:", err);
      setError("Failed to load collection report.");
      setData([]);
      setFilteredData([]);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [user?.userId, latitude, longitude, fromDate, toDate, locationLoading]);

  // Auto load on mount
  useEffect(() => {
    if (user?.userId && !locationLoading && latitude !== null && longitude !== null) {
      loadData();
    }
  }, [loadData]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((term) => {
        if (!term.trim()) {
          setFilteredData(data);
          return;
        }
        const lowerTerm = term.toLowerCase();
        const filtered = data.filter((item) =>
          [
            item.branchName,
            item.memberName,
            item.memberCode,
            item.applyDate,
            item.loanName,
            item.loanNo,
            item.loanAmount.toString(),
            item.emiAmount.toString(),
            item.loanDate,
            item.loanPaidAmt.toString(),
            item.loanDueAmt.toString(),
            item.totalInstDues.toString(),
          ].some((val) => val?.toString().toLowerCase().includes(lowerTerm))
        );
        setFilteredData(filtered);
      }, 500),
    [data]
  );

  const handleSearch = (value) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredData.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportData = filteredData.map((item) => ({
      "Branch Name": item.branchName,
      "Member Name": item.memberName,
      "Member Code": item.memberCode,
      "Apply Date": item.applyDate,
      "Loan Name": item.loanName,
      "Loan No": item.loanNo,
      "Loan Amount": item.loanAmount,
      "EMI Amount": item.emiAmount,
      "Loan Date": item.loanDate,
      "Loan Paid Amount": item.loanPaidAmt,
      "Loan Due Amount": item.loanDueAmt,
      "Total Inst Due": item.totalInstDues,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CollectionReport");
    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Collection_Report_${today}.xlsx`);
    toast.success("Exported successfully!");
  };

  // Format helpers
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "—") return "—";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day).toLocaleDateString("en-IN");
    }
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  // Table Columns
  const columns = [
    {
      title: <span className="font-bold text-indigo-700">Branch</span>,
      dataIndex: "branchName",
      key: "branchName",
      align: "center",
      sorter: (a, b) => a.branchName.localeCompare(b.branchName),
    },
    {
      title: <span className="font-bold text-indigo-700">Member Name</span>,
      dataIndex: "memberName",
      key: "memberName",
      align: "center",
      sorter: (a, b) => a.memberName.localeCompare(b.memberName),
    },
    {
      title: <span className="font-bold text-indigo-700">Member Code</span>,
      dataIndex: "memberCode",
      key: "memberCode",
      align: "center",
    },
    {
      title: <span className="font-bold text-indigo-700">Apply Date</span>,
      dataIndex: "applyDate",
      key: "applyDate",
      align: "center",
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.applyDate) - new Date(b.applyDate),
    },
    {
      title: <span className="font-bold text-indigo-700">Loan Name</span>,
      dataIndex: "loanName",
      key: "loanName",
      align: "center",
    },
    {
      title: <span className="font-bold text-indigo-700">Loan No</span>,
      dataIndex: "loanNo",
      key: "loanNo",
      align: "center",
      render: (text) => <span className="font-semibold text-indigo-600">{text}</span>,
      sorter: (a, b) => a.loanNo.localeCompare(b.loanNo),
    },
    {
      title: <span className="font-bold text-indigo-700">Loan Amount</span>,
      dataIndex: "loanAmount",
      key: "loanAmount",
      align: "center",
      render: (amount) => (
        <span className="font-semibold text-green-700">{formatCurrency(amount)}</span>
      ),
      sorter: (a, b) => a.loanAmount - b.loanAmount,
    },
    {
      title: <span className="font-bold text-indigo-700">EMI Amount</span>,
      dataIndex: "emiAmount",
      key: "emiAmount",
      align: "center",
      render: (amount) => (
        <span className="font-semibold text-blue-700">{formatCurrency(amount)}</span>
      ),
      sorter: (a, b) => a.emiAmount - b.emiAmount,
    },
    {
      title: <span className="font-bold text-indigo-700">Loan Date</span>,
      dataIndex: "loanDate",
      key: "loanDate",
      align: "center",
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.loanDate) - new Date(b.loanDate),
    },
    {
      title: <span className="font-bold text-indigo-700">Paid Amount</span>,
      dataIndex: "loanPaidAmt",
      key: "loanPaidAmt",
      align: "center",
      render: (amount) => (
        <span className="font-semibold text-green-700">{formatCurrency(amount)}</span>
      ),
      sorter: (a, b) => a.loanPaidAmt - b.loanPaidAmt,
    },
    {
      title: <span className="font-bold text-indigo-700">Due Amount</span>,
      dataIndex: "loanDueAmt",
      key: "loanDueAmt",
      align: "center",
      render: (amount) => (
        <span className={amount > 0 ? "font-semibold text-red-700" : "font-semibold text-green-700"}>
          {formatCurrency(amount)}
        </span>
      ),
      sorter: (a, b) => a.loanDueAmt - b.loanDueAmt,
    },
    {
      title: <span className="font-bold text-indigo-700">Total Inst Due</span>,
      dataIndex: "totalInstDues",
      key: "totalInstDues",
      align: "center",
      render: (value) => <span className="font-semibold">{value}</span>,
      sorter: (a, b) => a.totalInstDues - b.totalInstDues,
    },
    {
      title: <span className="font-bold text-indigo-700">Action</span>,
      key: "action",
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/associate/loan/loan_details?token=${record.loanId}`)}
          className="text-indigo-600 hover:text-indigo-800 font-large"
        >
          View →
        </Button>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <MenuItems />

      <div className="flex-1 flex flex-col overflow-auto">
        <Search />

        <div className="p-3 md:p-4 space-y-5">
          {/* Header Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-5">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Collection Report
                </h1>
                <p className="text-gray-600 mt-1">View all collection details and dues status</p>
              </div>

              <Space size={[1, 18]}>
                <Button
                  onClick={loadData}
                  loading={loading}
                  icon={<i className="fa-solid fa-sync-alt mr-2"></i>}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none shadow-lg hover:scale-102 transition-all"
                  size="large"
                >
                  Refresh Data
                </Button>
                <Button
                  onClick={exportToExcel}
                  disabled={filteredData.length === 0}
                  icon={<ExportOutlined />}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-none shadow-lg hover:scale-102 transition-all"
                  size="large"
                >
                  Export Excel
                </Button>
              </Space>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-700 whitespace-nowrap">From:</label>
                <DatePicker
                  selected={fromDate}
                  onChange={setFromDate}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}
                  popperPlacement="bottom-start"
                  portalId="root-portal"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="font-semibold text-gray-700 whitespace-nowrap">To:</label>
                <DatePicker
                  selected={toDate}
                  onChange={setToDate}
                  dateFormat="dd/MM/yyyy"
                  maxDate={new Date()}
                  popperPlacement="bottom-start"
                  portalId="root-portal"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Search & Table Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6">
            <div className="mb-6">
              <AntSearch
                placeholder="Search by member name, loan no, branch, amount, etc..."
                allowClear
                enterButton={
                  <Button icon={<SearchOutlined />} type="primary">
                    Search
                  </Button>
                }
                size="large"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onSearch={handleSearch}
                className="w-full max-w-md"
                style={{ borderRadius: "12px" }}
              />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
                {error}
              </div>
            )}

            <Table
              columns={columns}
              dataSource={filteredData}
              loading={tableLoading}
              pagination={{
                pageSizeOptions: ["50", "100", "200", "500"],
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `Showing ${range[0]}-${range[1]} of ${total} collections`,
                placement: ["bottomCenter"],
              }}
              scroll={{ x: 1700 }}
              bordered={false}
              rowClassName="hover:bg-indigo-50/50 transition-all"
              className="modern-ant-table"
            />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default CollectionReport;