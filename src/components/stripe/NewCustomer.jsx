import React, { useState } from "react";
import qs from "qs";
import "../../App.css";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
  IbanElement,
} from "@stripe/react-stripe-js";

const stripe_publishable_key = "pk_test_l6ueGUx2yZIkGQJoiuQA1DCr00a4G1rhvh";
const stripe_secret_key = "sk_test_dSbbUbTkgEOKpUlIlKxAHCgx00Latf5dEy";

//class NewCustomer extends Component {
const NewCustomer = () => {
  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  const IBAN_ELEMENT_OPTIONS = {
    supportedCountries: ["SEPA"],
    style: {
      base: {
        color: "#32325d",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
        ":-webkit-autofill": {
          color: "#32325d",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
        ":-webkit-autofill": {
          color: "#fa755a",
        },
      },
    },
  };

  const CheckoutForm = () => {
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [ibanerror, ibansetError] = useState(null);
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bankName, setBankName] = useState("");

    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [country, setCountry] = useState("");

    // Handle real-time validation errors from the card Element.
    const handleChange = (event) => {
      if (event.error) {
        setError(event.error.message);
      } else {
        setError(null);
      }
    };

    const handleIBanChange = (event) => {
      if (event.error) {
        ibansetError(event.error.message);
      } else {
        ibansetError(null);
      }
    };

    // Handle form submission.
    const handleSubmit = async (event) => {
      event.preventDefault();
      setMessage("");
      const card = elements.getElement(CardElement);
      const cardToken = await stripe.createToken(card);
      console.log(cardToken);

      const ibanElement = elements.getElement(IbanElement);
      const ibanResult = await stripe.createPaymentMethod({
        type: "sepa_debit",
        sepa_debit: ibanElement,
        billing_details: {
          name,
          email,
        },
      });
      console.log(ibanResult);

      if (cardToken.error && ibanResult.error) {
        return;
      } else if (cardToken.error) {
        card.clear();
      } else if (ibanResult.error) {
        ibanElement.clear();
      }

      let request = {
        name: name,
        email: email,
        address: {
          line1: address,
          city: city,
          state: state,
          postal_code: postalCode,
          country: country,
        },
      };
      if (ibanResult.paymentMethod && ibanResult.paymentMethod.id) {
        request.payment_method = ibanResult.paymentMethod.id;
      }
      console.log(request);

      axios({
        method: "post",
        url: "https://api.stripe.com/v1/customers",
        data: qs.stringify(request),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Bearer " + stripe_secret_key,
        },
      })
        .then(function (response) {
          if (cardToken.token && cardToken.token.id) {
            createCustomerSource(response.data.id, cardToken.token.id);
          }
          setMessage("Customer info saved successfully!");
          clearInputs();
        })
        .catch(function (response) {
          console.log(response);
        });
    };

    const createCustomerSource = (customer_id, token_id) => {
      let url =
        "https://api.stripe.com/v1/customers/" + customer_id + "/sources";
      axios({
        method: "post",
        url: url,
        data: qs.stringify({
          source: token_id,
        }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Bearer " + stripe_secret_key,
        },
      })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (response) {
          console.log(response);
        });
    };

    const clearInputs = () => {
      setName("");
      setEmail("");
      setAddress("");
      setCity("");
      setState("");
      setPostalCode("");
      setCountry("");
      elements.getElement(CardElement).clear();
      elements.getElement(IbanElement).clear();
    };

    return (
      <form className="new-customer-form" onSubmit={handleSubmit}>
        <div className="form-header">Customer Information</div>
        <div className="form-body">
          <div className="form-row inline">
            <div className="col">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                placeholder="Jenny Rosen"
                required
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
              />
            </div>
            <div className="col">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="name"
                type="email"
                placeholder="jenny.rosen@example.com"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="address">Address</label>
            <input
              name="address"
              className="field"
              placeholder="185 Berry Street Suite 550"
              required
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
              }}
            />
          </div>
          <div className="form-row inline">
            <div className="col">
              <label htmlFor="city">City</label>
              <input
                name="city"
                className="field"
                placeholder="San Francisco"
                required
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                }}
              />
            </div>
            <div className="col">
              <label htmlFor="state">State</label>
              <input
                name="state"
                className="field"
                placeholder="CA"
                required
                value={state}
                onChange={(event) => {
                  setState(event.target.value);
                }}
              />
            </div>
          </div>
          <div className="form-row inline">
            <div className="col">
              <label htmlFor="postal_code">Postal Code</label>
              <input
                name="postal_code"
                className="field"
                placeholder="94107"
                required
                value={postalCode}
                onChange={(event) => {
                  setPostalCode(event.target.value);
                }}
              ></input>
            </div>
            <div className="col">
              <label htmlFor="country">Country</label>
              <select
                name="country"
                required
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value);
                }}
              >
                <option value="AU">Australia</option>
                <option value="AT">Austria</option>
                <option value="BE">Belgium</option>
                <option value="BR">Brazil</option>
                <option value="CA">Canada</option>
                <option value="CN">China</option>
                <option value="DK">Denmark</option>
                <option value="FI">Finland</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
                <option value="HK">Hong Kong</option>
                <option value="IE">Ireland</option>
                <option value="IT">Italy</option>
                <option value="JP">Japan</option>
                <option value="LU">Luxembourg</option>
                <option value="MY">Malaysia</option>
                <option value="MX">Mexico</option>
                <option value="NL">Netherlands</option>
                <option value="NZ">New Zealand</option>
                <option value="NO">Norway</option>
                <option value="PT">Portugal</option>
                <option value="SG">Singapore</option>
                <option value="ES">Spain</option>
                <option value="SE">Sweden</option>
                <option value="CH">Switzerland</option>
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="card-element">Credit or debit card</label>
            <CardElement
              id="card-element"
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleChange}
            />
            <div className="card-errors" role="alert">
              {error}
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="iban-element">IBAN</label>
            <IbanElement
              id="iban-element"
              options={IBAN_ELEMENT_OPTIONS}
              onChange={handleIBanChange}
            />
            <div className="card-errors" role="alert">
              {ibanerror}
            </div>
          </div>
          <div id="bank-name" className={bankName ? "visible" : ""}>
            {bankName}
          </div>
          <div className="form-row text-align-center">
            <button className="submit-btn" type="submit">
              Save
            </button>
            <div className="info" role="info">
              {message}
            </div>
          </div>
        </div>
      </form>
    );
  };

  const stripePromise = loadStripe(stripe_publishable_key);

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default NewCustomer;
