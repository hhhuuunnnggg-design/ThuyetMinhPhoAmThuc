import { setAuth } from "@/redux/slice/auth.slice";
import { loginAPI } from "@/services/api";
import { Button, Form, Input, message } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./login.scss";

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    try {
      const res = await loginAPI(values.email, values.password);
      if (res && res.data) {
        localStorage.setItem("access_token", res.data.access_token);
        dispatch(
          setAuth({
            isAuthenticated: true,
            user: res.data.user,
          })
        );
        message.success("Đăng nhập thành công!");
        navigate("/admin");
      }
    } catch (error: any) {
      message.error(error.mesage || "Đăng nhập thất bại!");
    }
  };

  return (
    <div className="login-page">
      <Form
        name="login"
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 400, margin: "50px auto" }}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Vui lòng nhập email!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginPage;
