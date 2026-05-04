import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import styles from "./styles.module.css";
import {
  FaEye,
  FaEyeSlash,
  FaCloudUploadAlt,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "user",
    expertise: "",
    experience: "",
    shopName: "",
    phone: "",
  });

  const [metrics, setMetrics] = useState({
    minChar: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  const [isEmailValid, setIsEmailValid] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Password Validation (Including Lowercase check)
    setMetrics({
      minChar: data.password.length >= 8,
      upper: /[A-Z]/.test(data.password),
      lower: /[a-z]/.test(data.password),
      number: /[0-9]/.test(data.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(data.password),
    });

    // Email Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (data.email.length > 0) {
      setIsEmailValid(emailRegex.test(data.email));
    } else {
      setIsEmailValid(true);
    }
  }, [data.password, data.email]);

  const handleChange = ({ currentTarget: input }) => {
    setData((prev) => ({ ...prev, [input.name]: input.value }));
    setError("");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(data.firstName) || !nameRegex.test(data.lastName)) {
      setError("First and Last names should only contain letters.");
      return;
    }

    const isPasswordSecure = Object.values(metrics).every(Boolean);
    if (!isPasswordSecure) {
      setError("Please meet all password requirements.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      let documentUrl = "";
      if (file && (data.role === "vendor" || data.role === "teacher")) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          import.meta.env.VITE_CLOUDINARY_PRESET
        );
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          formData
        );
        documentUrl = uploadRes.data.secure_url;
      } else if (!file && (data.role === "vendor" || data.role === "teacher")) {
        setError(`Please upload ${data.role === "vendor" ? "Shop License/Aadhar" : "Certificate/Aadhar"}.`);
        setUploading(false);
        return;
      }

      const url = "http://localhost:8080/api/users";
      const payload = { ...data, documentUrl };
      const response = await axios.post(url, payload);
      enqueueSnackbar(response.data.message || "Account created!", {
        variant: "success",
      });
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Server error";
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.signup_container}>
      <div className={styles.signup_form_container}>
        <div className={styles.left}>
          <h1>Welcome Back</h1>
          <Link to="/login">
            <button type="button" className={styles.white_btn}>
              Sign In
            </button>
          </Link>
        </div>
        <div className={styles.right}>
          <form className={styles.form_container} onSubmit={handleSubmit}>
            <h1>Create Account</h1>

            <div className={styles.grid_row}>
              <input
                type="text"
                placeholder="First Name"
                name="firstName"
                value={data.firstName}
                onChange={handleChange}
                required
                className={styles.input}
              />
              <input
                type="text"
                placeholder="Last Name"
                name="lastName"
                value={data.lastName}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.full_width}>
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={data.email}
                onChange={handleChange}
                required
                className={`${styles.input} ${!isEmailValid && data.email.length > 0 ? styles.input_error : ""}`}
              />
              {!isEmailValid && data.email.length > 0 && (
                <span className={styles.email_hint}>
                  Enter a valid email format
                </span>
              )}
            </div>

            <div className={styles.grid_row}>
              <div className={styles.password_wrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                  value={data.password}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
                <div
                  className={styles.eye_icon}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>

              {data.password.length > 0 && (
                <div className={styles.validation_box}>
                  <div className={metrics.minChar ? styles.v_item_valid : styles.v_item_invalid}>
                    <FaCheck /> 8+ Chars
                  </div>
                  <div className={metrics.upper ? styles.v_item_valid : styles.v_item_invalid}>
                    <FaCheck /> Uppercase
                  </div>
                  <div className={metrics.lower ? styles.v_item_valid : styles.v_item_invalid}>
                    <FaCheck /> Lowercase
                  </div>
                  <div className={metrics.number ? styles.v_item_valid : styles.v_item_invalid}>
                    <FaCheck /> Number
                  </div>
                  <div className={metrics.special ? styles.v_item_valid : styles.v_item_invalid}>
                    <FaCheck /> Special
                  </div>
                </div>
              )}
            </div>

            <div className={styles.grid_row}>
              {data.role === "teacher" && (
                <>
                  <input
                    type="text"
                    placeholder="Expertise (e.g. Maths)"
                    name="expertise"
                    value={data.expertise}
                    onChange={handleChange}
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Experience (Years)"
                    name="experience"
                    value={data.experience}
                    onChange={handleChange}
                    className={styles.input}
                  />
                </>
              )}
              {data.role === "vendor" && (
                <>
                  <input
                    type="text"
                    placeholder="Shop Name"
                    name="shopName"
                    value={data.shopName}
                    onChange={handleChange}
                    required
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    name="phone"
                    value={data.phone}
                    onChange={handleChange}
                    required
                    className={styles.input}
                  />
                </>
              )}
            </div>

            <div className={styles.grid_row}>
              <select
                name="role"
                value={data.role}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="user">User</option>
                <option value="teacher">Teacher</option>
                <option value="vendor">Vendor</option>
              </select>

              {(data.role === "vendor" || data.role === "teacher") && (
                <div className={styles.file_upload_wrapper}>
                  <label htmlFor="doc">
                    <FaCloudUploadAlt />{" "}
                    {file ? "File Selected" : (data.role === "teacher" ? "Teaching Degree/Aadhar" : "Shop License/Aadhar")}
                  </label>
                  <input
                    type="file"
                    id="doc"
                    onChange={handleFileChange}
                    required
                  />
                  {file && (
                    <span className={styles.file_name}>{file.name}</span>
                  )}
                </div>
              )}
            </div>

            {error && <div className={styles.error_msg}>{error}</div>}

            <button
              type="submit"
              className={styles.green_btn}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;