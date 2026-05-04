import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSnackbar } from "notistack";
import { FaUserCheck, FaStore, FaHourglassHalf, FaCheckCircle, FaTrashAlt, FaCalendarAlt, FaEye } from "react-icons/fa";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [vendors, setVendors] = useState([]);
  const [teachers, setTeachers] = useState([]); 
  const [stats, setStats] = useState({ teachers: 0, vendors: 0 }); 
  
  // ✅ NEW STATES
  const [verifiedTeachers, setVerifiedTeachers] = useState([]);
  const [verifiedVendors, setVerifiedVendors] = useState([]);
  const [normalUsers, setNormalUsers] = useState([]);
  const [pendingStateContent, setPendingStateContent] = useState([]); // ⭐ NEW
  const [activeTab, setActiveTab] = useState("pending");

  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchAllPending();
  }, []);

  const fetchAllPending = async () => {
    try {
      // ✅ UPDATED: Fetching using the generalized routes to fix 404
      const [venRes, teaRes, statsRes, verTeaRes, verVenRes, usrRes, pendingStateRes] = await Promise.all([
        axios.get("http://localhost:8080/api/users/admin/pending/vendor"),
        axios.get("http://localhost:8080/api/users/admin/pending/teacher"),
        axios.get("http://localhost:8080/api/users/admin/stats"),
        axios.get("http://localhost:8080/api/users/admin/verified/teacher"),
        axios.get("http://localhost:8080/api/users/admin/verified/vendor"),
        axios.get("http://localhost:8080/api/users/admin/verified/user"),
        axios.get("http://localhost:8080/api/states/admin/pending", { headers: { "x-auth-token": localStorage.getItem("token") } }) // ⭐ NEW
      ]);
      
      setVendors(venRes.data.users || []);
      setTeachers(teaRes.data.users || []);
      setStats(statsRes.data || { teachers: 0, vendors: 0 });
      setVerifiedTeachers(verTeaRes.data.users || []);
      setVerifiedVendors(verVenRes.data.users || []);
      setNormalUsers(usrRes.data.users || []);
      setPendingStateContent(pendingStateRes.data.data || []); // ⭐ NEW
      
      setLoading(false);
    } catch (err) {
      enqueueSnackbar("Error loading dashboard", { variant: "error" });
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      // ✅ UPDATED: Using universal verify-user route
      await axios.put(`http://localhost:8080/api/users/admin/verify-user/${id}`);
      enqueueSnackbar("Approved Successfully!", { variant: "success" });
      fetchAllPending(); 
    } catch (err) {
      enqueueSnackbar("Approval failed", { variant: "error" });
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject this request?")) {
        try {
            // ✅ UPDATED: Using universal reject-user route
            const url = `http://localhost:8080/api/users/admin/reject-user/${id}`;
            await axios.put(url);
            enqueueSnackbar("Request Rejected!", { variant: "warning" });
            fetchAllPending(); 
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to reject";
            enqueueSnackbar(msg, { variant: "error" });
        }
    }
  };

  // ⭐ NEW: Handle State Content Approval
  const handleApproveContent = async (id) => {
    try {
      await axios.patch(`http://localhost:8080/api/states/admin/approve/${id}`, {}, { headers: { "x-auth-token": localStorage.getItem("token") } });
      enqueueSnackbar("State Content Approved!", { variant: "success" });
      fetchAllPending(); 
    } catch (err) {
      enqueueSnackbar("Approval failed", { variant: "error" });
    }
  };

  // ⭐ NEW: Handle State Content Rejection
  const handleRejectContent = async (id) => {
    if (window.confirm("Reject this content submission?")) {
        try {
            await axios.delete(`http://localhost:8080/api/states/${id}`); // Uses existing delete route
            enqueueSnackbar("State Content Rejected!", { variant: "warning" });
            fetchAllPending(); 
        } catch (err) {
            enqueueSnackbar("Failed to reject", { variant: "error" });
        }
    }
  };

  if (loading) return <div className="admin-loader-container"><div className="spinner"></div></div>;

  // Reusable Component for Tables to keep your UI identical
  const RenderTable = (title, dataList, icon) => (
    <div className="admin-table-section" style={{marginBottom: "30px"}}>
        <div className="table-header"><h2>{icon} {title}</h2></div>
        <div className="admin-table-responsive">
          <table className="modern-admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Expertise/Shop</th>
                <th>Identity Proof</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dataList.length > 0 ? dataList.map((v) => (
                <tr key={v._id}>
                  <td>
                    <div className="vendor-name-cell">
                      <div className="avatar-circle">{v.firstName.charAt(0)}</div>
                      <div>
                        <div className="full-name">{v.firstName} {v.lastName}</div>
                        <div className="sub-text">Role: {v.role}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="shop-pill">{v.shopName || v.expertise || "N/A"}</span></td>
                  <td>
                    {v.documentUrl ? (
                      <a href={v.documentUrl} target="_blank" rel="noopener noreferrer" className="view-doc-btn"><FaEye /> View</a>
                    ) : <span className="no-doc-tag">No Doc</span>}
                  </td>
                  <td>
                    <div className="action-btn-group">
                      <button className="btn-approve" onClick={() => handleApprove(v._id)}><FaCheckCircle /> Approve</button>
                      <button className="btn-reject" onClick={() => handleReject(v._id)}><FaTrashAlt /> Reject</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="admin-empty-state">No pending {title}! ✅</td></tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );

  const RenderVerifiedTable = (title, dataList, icon) => (
    <div className="admin-table-section" style={{marginBottom: "30px"}}>
        <div className="table-header"><h2>{icon} {title}</h2></div>
        <div className="admin-table-responsive">
          <table className="modern-admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role Info</th>
                <th>Contact</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {dataList.length > 0 ? dataList.map((v) => (
                <tr key={v._id}>
                  <td>
                    <div className="vendor-name-cell">
                      <div className="avatar-circle">{v.firstName.charAt(0)}</div>
                      <div>
                        <div className="full-name">{v.firstName} {v.lastName}</div>
                        <div className="sub-text">Role: {v.role}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="shop-pill">{v.shopName || v.expertise || "N/A"}</span></td>
                  <td>{v.email}</td>
                  <td>{new Date(v.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="admin-empty-state">No {title} found!</td></tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );

  // ⭐ NEW: State Content Table
  const RenderStateContentTable = () => (
    <div className="admin-table-section" style={{marginBottom: "30px"}}>
        <div className="table-header"><h2><FaHourglassHalf /> Pending State Content</h2></div>
        <div className="admin-table-responsive">
          <table className="modern-admin-table">
            <thead>
              <tr>
                <th>State & Category</th>
                <th>Content Detail</th>
                <th>AI Fact-Check Analysis</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingStateContent.length > 0 ? pendingStateContent.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong>{c.stateName}</strong><br/>
                    <span className="shop-pill">{c.category}</span>
                  </td>
                  <td>
                    <strong>{c.title}</strong><br/>
                    <small style={{display: 'inline-block', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.description}</small>
                  </td>
                  <td>
                    <div style={{ backgroundColor: "#fef3c7", padding: "8px", borderRadius: "6px", fontSize: "0.85rem", color: "#92400e" }}>
                      <strong>🤖 Gemini AI:</strong> {c.aiFactCheck}
                    </div>
                  </td>
                  <td>
                    <div className="action-btn-group">
                      <button className="btn-approve" onClick={() => handleApproveContent(c._id)}><FaCheckCircle /> Approve</button>
                      <button className="btn-reject" onClick={() => handleRejectContent(c._id)}><FaTrashAlt /> Reject</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="admin-empty-state">No pending state content! ✅</td></tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );

  return (
    <div className="admin-dashboard-wrapper">
      <header className="admin-dashboard-header">
        <div className="header-text">
          <h1>Admin Management</h1>
          <p>Verify vendors/teachers to maintain marketplace integrity.</p>
        </div>
        <div className="header-date">
          <FaCalendarAlt /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </header>

      <div className="admin-tabs" style={{ display: "flex", gap: "15px", marginBottom: "30px", flexWrap: "wrap" }}>
        <button className={`admin-tab-btn ${activeTab === "pending" ? "active" : ""}`} onClick={() => setActiveTab("pending")}>Pending Approvals</button>
        <button className={`admin-tab-btn ${activeTab === "teachers" ? "active" : ""}`} onClick={() => setActiveTab("teachers")}>Verified Teachers</button>
        <button className={`admin-tab-btn ${activeTab === "vendors" ? "active" : ""}`} onClick={() => setActiveTab("vendors")}>Verified Vendors</button>
        <button className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>Registered Users</button>
        <button className={`admin-tab-btn ${activeTab === "state-content" ? "active" : ""}`} onClick={() => setActiveTab("state-content")}>Pending State Content</button>
      </div>

      {activeTab === "pending" && (
        <>
          <div className="stats-grid">
            <div className="stat-card pending">
              <div className="stat-icon"><FaHourglassHalf /></div>
              <div className="stat-info">
                <h3>{vendors.length + teachers.length}</h3>
                <p>Total Pending Requests</p>
              </div>
            </div>
            <div className="stat-card" style={{ backgroundColor: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }}>
              <div className="stat-icon"><FaUserCheck /></div>
              <div className="stat-info">
                <h3>{stats.teachers}</h3>
                <p>Registered Teachers</p>
              </div>
            </div>
            <div className="stat-card" style={{ backgroundColor: "#dcfce3", color: "#166534", borderColor: "#bbf7d0" }}>
              <div className="stat-icon"><FaStore /></div>
              <div className="stat-info">
                <h3>{stats.vendors}</h3>
                <p>Registered Vendors</p>
              </div>
            </div>
          </div>

          {RenderTable("Vendor Requests", vendors, <FaStore />)}
          {RenderTable("Teacher Requests", teachers, <FaUserCheck />)}
        </>
      )}

      {activeTab === "teachers" && RenderVerifiedTable("Verified Teachers", verifiedTeachers, <FaUserCheck />)}
      {activeTab === "vendors" && RenderVerifiedTable("Verified Vendors", verifiedVendors, <FaStore />)}
      {activeTab === "users" && RenderVerifiedTable("Registered Users", normalUsers, <FaUserCheck />)}
      {activeTab === "state-content" && RenderStateContentTable()}

    </div>
  );
};

export default AdminDashboard;