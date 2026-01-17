import { registerAPI } from "@/api";
import type { FormProps } from "antd";
import {
  App,
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Select,
  Steps,
} from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./register.scss";

// loại dữ liệu mà bạn phải điền vào
type FieldTypeRegister = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Dayjs | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  work: string;
  education: string;
  current_city: string;
  hometown: string;
  bio: string;
};

// dữ liệu mà bạn cần phải điền vào
interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Dayjs | null;
  gender?: "MALE" | "FEMALE" | "OTHER";
  work?: string;
  education?: string;
  current_city?: string;
  hometown?: string;
  bio?: string;
}

const RegisterPage = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [isSubmit, setIsSubmit] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const onFinish: FormProps<FieldTypeRegister>["onFinish"] = async (values) => {
    setIsSubmit(true);

    const userData: UserData = {
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth,
    };

    const res = await registerAPI(userData);
    if (res.data) {
      //success
      message.success("Đăng ký user thành công.");
      navigate("/login");
    } else {
      //error
      console.log(">>> Register error: ", res);
      message.error(res.message);
    }
    console.log(">>> Register response: ", res);

    setIsSubmit(false);
  };

  const nextStep = () => {
    // Validate only current step fields
    const currentStepFields = getCurrentStepFields(currentStep);
    form
      .validateFields(currentStepFields)
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch((errorInfo) => {
        console.log("Điền thiếu thông tin kìa thằng ngu", errorInfo);
      });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Get field names for current step
  const getCurrentStepFields = (step: number) => {
    if (step === 0) {
      return ["email", "password", "firstName", "lastName", "dateOfBirth"];
    } else if (step === 1) {
      return ["gender", "work", "education", "current_city", "hometown", "bio"];
    }
    return [];
  };

  const steps = [
    {
      title: "Thông tin cơ bản",
      content: (
        <div style={{ display: currentStep === 0 ? "block" : "none" }}>
          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email không được để trống!" },
              { type: "email", message: "Email không đúng định dạng!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Mật khẩu không được để trống!" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Họ"
            name="firstName"
            rules={[{ required: true, message: "Họ không được để trống!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Tên"
            name="lastName"
            rules={[{ required: true, message: "Tên không được để trống!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Ngày sinh"
            name="dateOfBirth"
            rules={[
              { required: true, message: "Ngày sinh không được để trống!" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
        </div>
      ),
    },
    {
      title: "Thông tin chi tiết",
      content: (
        <div style={{ display: currentStep === 1 ? "block" : "none" }}>
          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Giới tính"
            name="gender"
            rules={[
              { required: true, message: "Giới tính không được để trống!" },
            ]}
          >
            <Select>
              <Select.Option value="MALE">Nam</Select.Option>
              <Select.Option value="FEMALE">Nữ</Select.Option>
              <Select.Option value="OTHER">Khác</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Công việc"
            name="work"
            rules={[
              { required: true, message: "Công việc không được để trống!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Học vấn"
            name="education"
            rules={[
              { required: true, message: "Học vấn không được để trống!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Thành phố hiện tại"
            name="current_city"
            rules={[
              {
                required: true,
                message: "Thành phố hiện tại không được để trống!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Quê quán"
            name="hometown"
            rules={[
              { required: true, message: "Quê quán không được để trống!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldTypeRegister>
            labelCol={{ span: 24 }}
            label="Giới thiệu"
            name="bio"
            rules={[
              { required: true, message: "Giới thiệu không được để trống!" },
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <div className="register-page">
      <main className="main">
        <div className="container">
          <section className="wrapper">
            <div className="heading" style={{ textAlign: "center" }}>
              <h2 className="text text-large" style={{ marginBottom: "20px" }}>
                Đăng Ký Tài Khoản
              </h2>
              <div>
                <img
                  style={{ width: "30px", height: "30px" }}
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1024px-Facebook_Logo_%282019%29.png"
                  alt=""
                />
              </div>
              <span className="text text-normal" style={{ color: "#606770" }}>
                Nhanh chóng và dễ dàng.
              </span>
              <Divider />
            </div>

            <Steps
              current={currentStep}
              items={steps}
              style={{ marginBottom: 24 }}
            />

            <Form
              form={form}
              name="form-register"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
            >
              {/* Render all form items but only show current step */}
              {steps.map((step, index) => (
                <div
                  key={index}
                  style={{ display: currentStep === index ? "block" : "none" }}
                >
                  {step.content}
                </div>
              ))}

              <Form.Item>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  {currentStep > 0 && (
                    <Button onClick={prevStep}>Quay lại</Button>
                  )}

                  {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={nextStep}>
                      Tiếp theo
                    </Button>
                  )}

                  {currentStep === steps.length - 1 && (
                    <Button type="primary" htmlType="submit" loading={isSubmit}>
                      Đăng ký
                    </Button>
                  )}
                </div>
              </Form.Item>

              <Divider>Or</Divider>
              <p className="text text-normal" style={{ textAlign: "center" }}>
                Đã có tài khoản ?
                <span>
                  <Link to="/login"> Đăng Nhập </Link>
                </span>
              </p>
            </Form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
