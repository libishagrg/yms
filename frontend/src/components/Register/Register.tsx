import "./Register.css";
import FormHeader from "./component/FormHeader";
import Registerform from "./component/Registerform";
import Registervisual from "./component/Registervisual";

export default function Register() {
  return (
    <div className="register-page">
      <div className="form-side">
        <FormHeader />

        <Registerform />
      </div>

      <Registervisual />
    </div>
  );
}
