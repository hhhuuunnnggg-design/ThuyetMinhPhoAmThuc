import { setAuth } from "@/redux/slice/auth.slice";
import { loginAPI } from "@/services/api";
import { Button, Divider, Form, Input, message } from "antd";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import "./login.scss";

interface FieldType {
  email: string;
  password: string;
}

const LoginPage = () => {
  const [isSubmit, setIsSubmit] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = async (values: FieldType) => {
    try {
      setIsSubmit(true);
      const res = await loginAPI(values.email, values.password);
      console.log("Login response:", res);

      // Check if response has the correct structure
      if (res && res.data) {
        console.log("Login data:", res.data);

        // Check if access_token exists
        if (!res.data.access_token) {
          console.error("No access_token in response:", res.data);
          message.error("Không nhận được token đăng nhập!");
          return;
        }

        localStorage.setItem("access_token", res.data.access_token);
        console.log("Token saved:", res.data.access_token);

        // Update Redux store - context will automatically sync
        dispatch(
          setAuth({
            isAuthenticated: true,
            user: res.data.user,
          })
        );

        message.success("Đăng nhập thành công!");
        navigate("/admin/user");
      } else {
        console.error("Invalid response structure:", res);
        message.error("Response không đúng định dạng!");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      message.error(error.mesage || "Đăng nhập thất bại!");
    } finally {
      setIsSubmit(false);
    }
  };

  return (
    <div className="login-page">
      <main className="main">
        <div className="container">
          <section className="wrapper">
            <div className="heading" style={{ textAlign: "center" }}>
              <img
                style={{ width: "50px", height: "50px" }}
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png"
                alt=""
              />
              <h2 className="text text-large">Đăng Nhập</h2>
              <Divider />
            </div>
            <Form name="login-form" onFinish={onFinish} autoComplete="off">
              <Form.Item<FieldType>
                labelCol={{ span: 24 }} //whole column
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Email không được để trống!" },
                  { type: "email", message: "Email không đúng định dạng!" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item<FieldType>
                labelCol={{ span: 24 }} //whole column
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: "Mật khẩu không được để trống!" },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={isSubmit}>
                  Đăng nhập
                </Button>
              </Form.Item>
              <Divider>Or</Divider>
              <p className="text text-normal" style={{ textAlign: "center" }}>
                Chưa có tài khoản ?
                <span>
                  <Link to="/register"> Đăng Ký </Link>
                </span>
              </p>
              <br />
            </Form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
