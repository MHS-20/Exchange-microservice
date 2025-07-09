# Exchange microservice
## Context
Platform that allows authenticated users to simulate the purchase of dollars for euros and vice versa.
The platform must provide for user registration, viewing of their balance and transaction history, and the possibility of making deposits, purchases and withdrawals of money.

## Components
-  Backend
	- exchange microservice 
	- users microservice
	- api microservice
-  Frontend
	- react webapp

## Involved Tecnologies
- NodeJS/Express
- GRPC
- ReactJS
- PostgresSQL
- JWT/OpenAPI
- Docker/DockerCompose

### Backend
The backend consists of three microservices written in NodeJS, and a Postgres database.

The microservices must communicate with each other in a private network via GRPC, exposing port 9000 (exchange) and 9001 (users) respectively. The API, on the other hand, is the only microservice that can be reached externally and exposes the endpoints necessary for the frontend to function on port 80. All microservices must be developed in NodeJs and TypeScript.
 
The various microservices are listed more specifically below:

- **EXCHANGE**: this service takes care of calculating the currency exchange on a given quantity of euros into dollars or vice versa when the request is received. The updated exchange rate can be retrieved by looking at the xml provided directly by the [European Central Bank](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml?46f0dd7988932599cb1bcac79a10a16a)
The interface of this microservice is very simple and exposes only one GRPC function:
- `exchange(number value, string from, string to) // ex: exchange(10, "EUR", "USD")`

- **USERS**: this microservice takes care of the entire user registration, login and order management part. The interface of this microservice must provide the following GRPC functions:
- `signup(string email, string password, string name, string iban)`: this function saves the data of the newly registered user in the DB. NB. the user's password must not be saved in clear text on the DB but must first be hashed for security reasons.
- `login(string email, string password)`: this function releases a JWT to the user who will then be enabled to call protected API endpoints.
- `deposit(nubmer value, string symbol)`: allows the user to deposit the specified value in the specified currency into his account
- `withdraw(number value, string synbol)`: allows the user to move the specified amount of money in the specified currency from the platform to his iban. NB. the two functions `deposit` and `withdraw` are functions that only simulate money movements by simply updating values on the application's DB
- `buy(number value, string symbol)`: allows the user to buy with one currency the specified amount of money in the other available currency according to the exchange rate retrieved from the Exchange microservice; for each transaction it is necessary to store all the information regarding the operation in a specially structured DB table
- `listTransactions(object filter)`: allows the user to view his transactions with the possibility of filtering them by date and/or reference currency
- **API**: this microservice is the only one accessible directly from the outside and must be developed using OpenApi and Express. The purpose of the API is to receive external calls and route them to the various microservices.

### Frontend
Simple interactive web page that allows interaction with all components of the API (signup, login, purchase, sale and order viewing). This is done with React.

### Infrastructure
The entire application will be tested locally with Docker and docker-compose.

### Available Scripts
In the project directory, you can run:
 <br/> `` npm run server ``
 <br/> `` npm start ``

#### `npm start`
Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000)

#### `npm run build`
Builds the app for production to the `build` folder.\
