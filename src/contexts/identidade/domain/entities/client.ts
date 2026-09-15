import { randomUUID } from 'crypto';
import { DocumentVO } from '../../../shared/domain/value-objects/document.vo';
import { EmailVO } from '../value-objects/email.vo';
import { ClientStatus } from './client-status';

export type ClientProps = {
  name: string;
  document: DocumentVO;
  email: EmailVO;
  status: ClientStatus;
};

export class Client {
  public readonly id: string;
  private props: ClientProps;

  private constructor(props: ClientProps, id?: string) {
    this.id = id || randomUUID();
    this.props = props;
  }

  static create(
    input: {
      name: string;
      document: string;
      email: string;
      status?: ClientStatus;
    },
    id?: string,
  ): Client {
    return new Client(
      {
        name: input.name,
        document: DocumentVO.parse(input.document),
        email: EmailVO.parse(input.email),
        status: input.status ?? ClientStatus.ACTIVE,
      },
      id,
    );
  }

  get name() {
    return this.props.name;
  }

  get document() {
    return this.props.document.value;
  }

  get email() {
    return this.props.email.value;
  }

  get status() {
    return this.props.status;
  }

  get active() {
    return this.props.status === ClientStatus.ACTIVE;
  }

  updateEmail(email: string) {
    this.props.email = EmailVO.parse(email);
  }

  deactivate() {
    this.props.status = ClientStatus.INACTIVE;
  }

  activate() {
    this.props.status = ClientStatus.ACTIVE;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.props.name,
      document: this.props.document.value,
      email: this.props.email.value,
      status: this.props.status,
    };
  }
}
