import React from "react"
import { Row, Col } from "antd"
import 'antd/dist/antd.css';

export default props => <div id="message">
    <Row type="flex" justify="center">
        <Col xs={24} sm={18} md={12}>
            <div className="card text-center">
                <h1 className="light">Battleships</h1>
                <p className="light">{props.message}</p>
            </div>
        </Col>
    </Row>
</div>