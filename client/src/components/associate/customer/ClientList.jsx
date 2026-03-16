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

const ClientList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latitude, longitude } = useLocation();

  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1)
  );
  const [endDate, setEndDate] = useState(new Date());
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Load Data
  const loadData = useCallback(async () => {
    if (!user?.userId || latitude === null || longitude === null) {
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
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      };

      const response = await api.post(`${BASE_URL}/api/customerList`, payload);

      if (response.data?.resCode === "100" && Array.isArray(response.data.data)) {
        const mappedData = response.data.data.map((item) => ({
          key: item.customerKey,
          customerCode: item.customerCode,
          name: item.name,
          fatherName: item.fhName,
          enrollDate: item.enrollDate,
          aadhaarNo: item.aadhaarNumber || "—",
          panNo: item.panNum || "—",
          mobile: item.mobile,
          status: item.status,
          customerKey: item.customerKey,
          isActive: item.isActive,
        }));

        setData(mappedData);
        setFilteredData(mappedData);

        if (sessionStorage.getItem("skipToast") !== "true") {
          toast.success("Customer list loaded successfully!");
        }
        sessionStorage.removeItem("skipToast");
      } else {
        setData([]);
        setFilteredData([]);
        setError("No customer data found for the selected date range.");
        toast.error("No data available.");
      }
    } catch (err) {
      console.error("Error loading customer list:", err);
      setError("Failed to load customer list.");
      setData([]);
      setFilteredData([]);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  }, [user?.userId, latitude, longitude, startDate, endDate]);

  // Auto load on mount
  useEffect(() => {
    if (user?.userId && latitude !== null && longitude !== null) {
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
            item.customerCode,
            item.name,
            item.fatherName,
            item.aadhaarNo,
            item.panNo,
            item.mobile,
            item.status,
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
      "Customer Code": item.customerCode,
      Name: item.name,
      "Father Name": item.fatherName,
      "Enroll Date": item.enrollDate,
      "Aadhaar No": item.aadhaarNo,
      "Pan No": item.panNo,
      Mobile: item.mobile,
      Status: item.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Customer_List_${today}.xlsx`);
    toast.success("Exported successfully!");
  };

  // Table Columns
  const columns = [
    {
      title: <span className="font-bold text-indigo-700">Customer Code</span>,
      dataIndex: "customerCode",
      key: "customerCode",
      align: "center",
      render: (text, record) => (
        <button
          onClick={() => handleCustomerCodeClick(record)}
          className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
        >
          {text}
        </button>
      ),
      sorter: (a, b) => a.customerCode.localeCompare(b.customerCode),
    },
    {
      title: <span className="font-bold text-indigo-700">Name</span>,
      dataIndex: "name",
      key: "name",
      align: "center",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: <span className="font-bold text-indigo-700">Father Name</span>,
      dataIndex: "fatherName",
      key: "fatherName",
      align: "center",
    },
    {
      title: <span className="font-bold text-indigo-700">Enroll Date</span>,
      dataIndex: "enrollDate",
      key: "enrollDate",
      align: "center",
      render: (date) => new Date(date).toLocaleDateString("en-IN"),
      sorter: (a, b) => new Date(a.enrollDate) - new Date(b.enrollDate),
    },
    {
      title: <span className="font-bold text-indigo-700">Aadhaar</span>,
      dataIndex: "aadhaarNo",
      key: "aadhaarNo",
      align: "center",
    },
    {
      title: <span className="font-bold text-indigo-700">PAN</span>,
      dataIndex: "panNo",
      key: "panNo",
      align: "center",
    },
    {
      title: <span className="font-bold text-indigo-700">Mobile</span>,
      dataIndex: "mobile",
      key: "mobile",
      align: "center",
    },
    {
      title: <span className="font-bold text-indigo-700">Status</span>,
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => {
        let color = "default";
        if (status.toLowerCase().includes("success")) color = "green";
        else if (status.toLowerCase().includes("personal")) color = "blue";
        else if (status.toLowerCase().includes("upload")) color = "orange";
        else if (status.toLowerCase() === "active") color = "success";
        else if (status.toLowerCase() === "inactive") color = "error";

        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
      filters: [
        { text: "SUCCESS", value: "SUCCESS" },
        { text: "PERSONAL DETAILS", value: "PERSONAL" },
        { text: "UPLOAD DOCUMENTS", value: "UPLOAD" },
      ],
      onFilter: (value, record) =>
        record.status.toUpperCase().includes(value),
    },
    {
      title: <span className="font-bold text-indigo-700">Actions</span>,
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          {["ENROLL", "PERSONALDETAILS", "UPLOADDOCUMENTS"].includes(
            record.status.toUpperCase()
          ) ? (
            <Button
              type="primary"
              size="small"
              onClick={() => handleActionClick(record)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 border-none"
            >
              Complete Now
            </Button>
          ) : record.status.toUpperCase() === "SUCCESS" ? (
            <Button disabled size="small">
              Completed
            </Button>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </Space>
      ),
    },
  ];

  const handleCustomerCodeClick = (item) => {
    if (item.status.toUpperCase().includes("SUCCESS")) {
      navigate(`/associate/customer/CustomerProfile?Token=${item.customerKey}`);
    } else {
      setModalMessage("Please complete the registration first.");
      setShowModal(true);
    }
  };

  const handleActionClick = (item) => {
    const status = item.status.toLowerCase();
    if (status.includes("personal")) {
      navigate(`/associate/customer/ManualDetails?Token=${item.customerKey}`);
    } else if (status.includes("upload")) {
      navigate(`/associate/customer/UploadDocument?Token=${item.customerKey}`);
    } else {
      navigate(`/associate/customer/CustomerProfile?Token=${item.customerKey}`);
    }
  };

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
                  Customer List
                </h1>
                <p className="text-gray-600 mt-1">Manage and view all registered customers</p>
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
                  selected={startDate}
                  onChange={setStartDate}
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
                  selected={endDate}
                  onChange={setEndDate}
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
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-5">
            <div className="mb-6">
              <AntSearch
                placeholder="Search by name, code, mobile, Aadhaar, etc..."
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
                  `Showing ${range[0]}-${range[1]} of ${total} customers`,
                placement: ["bottomCenter"],
              }}
              scroll={{ x: 1200 }}
              bordered={false}
              rowClassName="hover:bg-indigo-50/50 transition-all"
              className="modern-ant-table"
            />
          </div>
        </div>

        <Footer />
      </div>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center">
            <i className="fa-solid fa-info-circle text-5xl text-indigo-600 mb-4"></i>
            <p className="text-lg font-semibold text-gray-800 mb-6">{modalMessage}</p>
            <Button
              type="primary"
              size="large"
              onClick={() => setShowModal(false)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 border-none"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;